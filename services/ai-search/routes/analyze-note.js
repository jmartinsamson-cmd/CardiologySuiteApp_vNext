/* eslint-env node */
/* global process, console */

/**
 * Analyze Note Route - AI-powered clinical note analysis with RAG
 * 
 * Accepts a clinical note and returns:
 * - assessment: string[] - AI-generated assessment points
 * - plan: string[] - AI-generated plan items
 * - citations: Array<{ title, url, blob?, mime? }> - Supporting citations
 * - confidence: number - Confidence score 0-1 (GPT-4 only)
 * - evidenceDocs: Array<{ title, sourceId, url }> - Retrieved evidence documents
 * - source: 'ai+rag' | 'rules' - Analysis source
 * 
 * Uses RAG (Retrieval-Augmented Generation) with Azure Search + GPT-4.
 * Falls back to rule-based analysis if Azure OpenAI is not configured.
 */

import { analyzeNoteWithRAG } from "../helpers/gpt4-analyzer.js";
import { logAIEvent } from "../helpers/telemetry.js";

const MAX_NOTE_SIZE = 256 * 1024; // 256KB limit
const DEBUG = process.env.DEBUG_ANALYZE === "true";

/**
 * Register /api/analyze-note route
 * @param {import("express").Application} app
 */
export default function registerAnalyzeNoteRoutes(app) {
  
  app.post("/api/analyze-note", async (req, res) => {
    try {
      const { note } = req.body || {};
      
      // Validation
      if (!note || typeof note !== "string") {
        return res.status(400).json({ 
          ok: false,
          error: "Missing or invalid 'note' field in request body",
          assessment: [],
          plan: [],
          citations: []
        });
      }
      
      if (note.trim().length === 0) {
        return res.status(400).json({ 
          ok: false,
          error: "Note cannot be empty",
          assessment: [],
          plan: [],
          citations: []
        });
      }
      
      if (note.length > MAX_NOTE_SIZE) {
        return res.status(413).json({ 
          ok: false,
          error: `Note too large (max ${MAX_NOTE_SIZE} bytes)`,
          assessment: [],
          plan: [],
          citations: []
        });
      }
      
      if (DEBUG) {
        console.log(`[analyze-note] Processing note: ${note.substring(0, 100)}...`);
      }
      
      // Use RAG pipeline: retrieve evidence → ground model → generate
      const t0 = Date.now();
      const result = await analyzeNoteWithRAG(note, req.body?.parsed);
      const latency = Date.now() - t0;
      
      const { assessment, plan, confidence, evidenceDocs, source } = result;
      
      // Build citations from evidence documents
      const citations = buildCitationsFromEvidence(evidenceDocs || []);
      
      // Telemetry
      try {
        logAIEvent("AIAnalyzer", {
          feature: "AIAnalyzer",
          phase: "analyze-note",
          provider: source || (confidence !== undefined ? "gpt-4" : "rules"),
          latencyMs: latency,
          cached: false,
        });
      } catch (/** @type {any} */ _err) {
        if (process.env.DEBUG_TELEMETRY === 'true') {
          console.log('[analyze-note] telemetry emit failed:', _err?.message || _err);
        }
      }

      // Return enriched data with RAG provenance
      res.json({
        ok: true,
        assessment,
        plan,
        citations,
        evidenceDocs: evidenceDocs || [], // RAG evidence documents
        source: source || (confidence !== undefined ? 'ai' : 'rules'), // 'ai+rag' | 'rules'
        confidence, // 0-1 confidence score from GPT-4
        telemetry: { latencyMs: latency, provider: source || (confidence !== undefined ? 'gpt-4' : 'rules') },
        meta: {
          noteLength: note.length,
          evidenceRetrieved: (evidenceDocs || []).length,
          citationsFound: citations.length,
          analyzer: source || (confidence !== undefined ? 'gpt-4' : 'rules'),
          ragEnabled: true
        }
      });
      
    } catch (/** @type {any} */ err) {
      console.error("[analyze-note] Error:", err);
      res.status(500).json({ 
        ok: false,
        error: "Analysis failed",
        message: err.message,
        assessment: [],
        plan: [],
        citations: [],
        evidenceDocs: [],
        source: 'error'
      });
    }
  });
}

/**
 * Build citations from RAG evidence documents
 * @param {Array<{title?: string, sourceId?: string, url?: string}>} evidenceDocs
 * @returns {Array<{ title?: string, url?: string, blob?: number[], mime?: string }>}
 */
function buildCitationsFromEvidence(evidenceDocs) {
  return evidenceDocs
    .map(doc => ({
      title: doc.title || 'Clinical Guideline',
      url: doc.url || undefined,
      // blob/mime would be populated if we stored PDFs in the index
      blob: undefined,
      mime: undefined
    }))
    .slice(0, 5); // max 5 citations
}
