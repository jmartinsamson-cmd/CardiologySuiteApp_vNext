/* eslint-env node */
/* global process */

/**
 * Analyze Note Route - AI-powered clinical note analysis
 * 
 * Accepts a clinical note and returns:
 * - assessment: string[] - AI-generated assessment points
 * - plan: string[] - AI-generated plan items
 * - citations: Array<{ title, url, blob?, mime? }> - Supporting citations
 * - confidence: number - Confidence score 0-1 (GPT-4 only)
 * 
 * Uses Azure OpenAI GPT-4 if configured, falls back to rule-based analysis.
 */

import { analyzeNoteWithGPT4 } from "../helpers/gpt4-analyzer.js";
import { logAIEvent } from "../helpers/telemetry.js";

const MAX_NOTE_SIZE = 256 * 1024; // 256KB limit
const DEBUG = process.env.DEBUG_ANALYZE === "true";

/**
 * Register /api/analyze-note route
 * @param {import("express").Application} app
 * @param {import("@azure/search-documents").SearchClient<any>} client
 */
export default function registerAnalyzeNoteRoutes(app, client) {
  
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
      
      // Extract key clinical terms for search
      const clinicalTerms = extractClinicalTerms(note);
      
      // Perform AI search for relevant guidelines/resources
      const searchResults = await performClinicalSearch(client, clinicalTerms);
      
  // Generate assessment and plan using GPT-4 (or rule-based fallback)
  const t0 = Date.now();
  const { assessment, plan, confidence } = await analyzeNoteWithGPT4(note, searchResults);
  const latency = Date.now() - t0;
      
      // Build citations from search results
      const citations = buildCitations(searchResults);
      
      // Telemetry
      try {
        logAIEvent("AIAnalyzer", {
          feature: "AIAnalyzer",
          phase: "analyze-note",
          provider: confidence !== undefined ? "gpt-4" : "rules",
          latencyMs: latency,
          cached: false,
        });
      } catch (/** @type {any} */ _err) {
        if (process.env.DEBUG_TELEMETRY === 'true') {
          console.log('[analyze-note] telemetry emit failed:', _err?.message || _err);
        }
      }

      // Return enriched data
      res.json({
        ok: true,
        assessment,
        plan,
        citations,
        confidence, // 0-1 confidence score from GPT-4
        telemetry: { latencyMs: latency, provider: confidence !== undefined ? 'gpt-4' : 'rules' },
        meta: {
          noteLength: note.length,
          termsExtracted: clinicalTerms.length,
          citationsFound: citations.length,
          analyzer: confidence !== undefined ? 'gpt-4' : 'rules'
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
        citations: []
      });
    }
  });
}

/**
 * Extract clinical terms from note for search
 * @param {string} note
 * @returns {string[]}
 */
function extractClinicalTerms(note) {
  /** @type {string[]} */
  const terms = [];
  const lowerNote = note.toLowerCase();
  
  // Common cardiac conditions
  const conditions = [
    'heart failure', 'hfref', 'hfpef', 'cardiomyopathy',
    'atrial fibrillation', 'afib', 'flutter',
    'coronary artery disease', 'cad', 'acs', 'mi', 'stemi', 'nstemi',
    'hypertension', 'htn',
    'valvular disease', 'aortic stenosis', 'mitral regurgitation',
    'arrhythmia', 'bradycardia', 'tachycardia'
  ];
  
  conditions.forEach(condition => {
    if (lowerNote.includes(condition)) {
      terms.push(condition);
    }
  });
  
  return Array.from(new Set(terms)); // dedupe
}

/**
 * Search for relevant clinical guidelines
 * @param {import("@azure/search-documents").SearchClient<any>} client
 * @param {string[]} terms
 * @returns {Promise<any[]>}
 */
async function performClinicalSearch(client, terms) {
  if (terms.length === 0) {
    return [];
  }
  
  const query = terms.join(" OR ");
  
  try {
    const searchOptions = {
      top: 5,
      select: ["title", "content", "url"],
      includeTotalCount: false
    };
    
    const results = [];
    const searchResult = await client.search(query, searchOptions);
    
    let count = 0;
    for await (const hit of searchResult.results) {
      results.push(hit);
      if (++count >= 5) break;
    }
    
    return results;
  } catch (err) {
    // Handle 404 index not found gracefully
    if (err?.statusCode === 404 || err?.code === 'ResourceNotFound') {
      console.log("[analyze-note] Search index not found (404) - returning empty results. Create index with: npm run search:index:put");
      return [];
    }
    console.error("[analyze-note] Search failed:", err);
    return [];
  }
}

// Note: Old analyzeNote, generateAssessmentPoints, and generatePlanItems functions
// have been moved to helpers/gpt4-analyzer.js and are used as fallback when
// Azure OpenAI is not configured.

/**
 * Build citations from search results
 * @param {any[]} searchResults
 * @returns {Array<{ title?: string, url?: string, blob?: number[], mime?: string }>}
 */
function buildCitations(searchResults) {
  return searchResults
    .filter(r => r.document)
    .map(r => {
      const doc = r.document;
      return {
        title: doc.title || 'Clinical Guideline',
        url: doc.url || undefined,
        // blob/mime would be populated if we stored PDFs in the index
        blob: undefined,
        mime: undefined
      };
    })
    .slice(0, 5); // max 5 citations
}
