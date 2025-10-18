/* eslint-env node */
/* global process */

/**
 * Azure OpenAI GPT-4 Analyzer
 * 
 * Provides intelligent clinical note analysis using GPT-4.
 * Falls back to rule-based analysis if Azure OpenAI is not configured.
 */

import { AzureOpenAI } from "openai";
import { withBackoff } from "./retry.js";
import { logAIEvent, recordCacheHit, recordAnalysisLatency } from "./telemetry.js";

// LRU Cache for repeated notes (optional enhancement)
class LRUCache {
  /**
   * @param {number} maxSize
   */
  constructor(maxSize = 100) {
    /** @type {Map<string, any>} */
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * @param {string} key
   * @returns {any}
   */
  get(key) {
    if (!this.cache.has(key)) return null;
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

const analysisCache = new LRUCache(100);
const USE_CACHE = process.env.ENABLE_ANALYSIS_CACHE === "true";

/**
 * Initialize Azure OpenAI client (if configured)
 * @returns {AzureOpenAI | null}
 */
function initializeOpenAI() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21-preview";

  if (!endpoint || !apiKey || !deployment) {
    console.log("[GPT-4] Azure OpenAI not configured - using rule-based analysis");
    return null;
  }

  try {
    return new AzureOpenAI({
      endpoint,
      apiKey,
      deployment,
      apiVersion
    });
  } catch (/** @type {any} */ err) {
    console.error("[GPT-4] Failed to initialize Azure OpenAI:", err.message);
    return null;
  }
}

// Lazily initialize the OpenAI client after the server loads environment variables.
// This avoids import-time initialization before dotenv.config() runs in server.js.
/** @type {AzureOpenAI | null} */
let openai = null;
let initAttempted = false;

export function getOpenAIClient() {
  if (!initAttempted) {
    initAttempted = true;
    openai = initializeOpenAI();
  }
  return openai;
}

/**
 * Analyze note using GPT-4 (if available) or rule-based fallback
 * @param {string} note - Clinical note text
 * @param {any[]} searchResults - Supporting search results
 * @returns {Promise<{assessment: string[], plan: string[], confidence?: number}>}
 */
export async function analyzeNoteWithGPT4(note, searchResults) {
  // Check cache first
  if (USE_CACHE) {
    const cacheKey = `${note.substring(0, 200)}:${searchResults.length}`;
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      console.log("[GPT-4] Cache hit");
      try { recordCacheHit(true); } catch (err) {
        if (process.env.DEBUG_TELEMETRY === "true") console.log("[gpt4] recordCacheHit failed", /** @type {any} */(err)?.message || err);
      }
      return cached;
    }
  }

  let result;

  const client = getOpenAIClient();
  if (client) {
    try {
      result = await analyzeWithGPT4(note, searchResults);
      console.log("[GPT-4] Analysis complete with confidence:", result.confidence);
    } catch (/** @type {any} */ err) {
      console.error("[GPT-4] Analysis failed, falling back to rules:", err.message);
      result = await analyzeWithRules(note, searchResults);
    }
  } else {
    result = await analyzeWithRules(note, searchResults);
  }

  // Cache the result
  if (USE_CACHE && result) {
    const cacheKey = `${note.substring(0, 200)}:${searchResults.length}`;
    analysisCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Analyze note using Azure OpenAI GPT-4
 * @param {string} note
 * @param {any[]} searchResults
 * @returns {Promise<{assessment: string[], plan: string[], confidence: number}>}
 */
async function analyzeWithGPT4(note, searchResults) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OpenAI client not initialized");
  }

  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";

  // Build context from search results
  const guidelinesContext = searchResults
    .slice(0, 3)
    .map((r, i) => {
      const doc = r.document || r;
      return `[${i + 1}] ${doc.title || 'Guideline'}: ${doc.content?.substring(0, 200) || ''}`;
    })
    .join('\n');

  const systemPrompt = `You are an expert cardiologist assistant. Analyze the clinical note and provide:
1. Assessment: Key clinical findings and diagnoses (2-5 points)
2. Plan: Evidence-based management recommendations (3-8 items)

Guidelines for reference:
${guidelinesContext || 'No specific guidelines retrieved'}

Return ONLY valid JSON in this exact format:
{
  "assessment": ["point 1", "point 2", ...],
  "plan": ["item 1", "item 2", ...],
  "confidence": 0.85
}

Confidence should be 0.0-1.0 based on note completeness and clarity.`;

  const t0 = Date.now();
  const completion = await withBackoff(() => client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: note }
    ],
    temperature: 0.3, // Lower temperature for more consistent medical advice
    max_tokens: 1000,
    response_format: { type: "json_object" }
  }));

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error("Empty response from GPT-4");
  }

  const parsed = JSON.parse(responseText);
  const latencyMs = Date.now() - t0;
  try {
    logAIEvent("AIAnalyzer ok", { feature: "AIAnalyzer", provider: "gpt-4", latencyMs });
    recordAnalysisLatency(latencyMs, { provider: "gpt-4" });
  } catch (/** @type {any} */ err) {
    if (process.env.DEBUG_TELEMETRY === "true") {
      console.log("[gpt4] telemetry emit failed:", err?.message || err);
    }
  }

  return {
    assessment: Array.isArray(parsed.assessment) ? parsed.assessment : [],
    plan: Array.isArray(parsed.plan) ? parsed.plan : [],
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.75
  };
}

/**
 * Fallback rule-based analysis (original implementation)
 * @param {string} note
 * @param {any[]} searchResults
 * @returns {Promise<{assessment: string[], plan: string[], confidence: number}>}
 */
async function analyzeWithRules(note, searchResults) {
  const assessment = generateAssessmentPoints(note, searchResults);
  const plan = generatePlanItems(note);

  // Calculate confidence based on detected patterns
  let confidence = 0.5;
  if (assessment.length >= 2) confidence += 0.2;
  if (plan.length >= 3) confidence += 0.2;
  if (searchResults.length > 0) confidence += 0.1;

  return {
    assessment,
    plan,
    confidence: Math.min(confidence, 1.0)
  };
}

/**
 * Generate assessment points from note (rule-based)
 * @param {string} note
 * @param {any[]} searchResults
 * @returns {string[]}
 */
function generateAssessmentPoints(note, searchResults) {
  const points = [];
  const lowerNote = note.toLowerCase();

  // Pattern matching for common conditions
  if (lowerNote.includes('heart failure') || lowerNote.includes('hfref') || lowerNote.includes('hfpef')) {
    points.push('Heart failure with reduced ejection fraction - requires optimization of guideline-directed medical therapy');
  }

  if (lowerNote.includes('atrial fibrillation') || lowerNote.includes('afib')) {
    points.push('Atrial fibrillation - assess CHA2DS2-VASc score and anticoagulation status');
  }

  if (lowerNote.includes('chest pain') || lowerNote.includes('angina')) {
    points.push('Chest pain - consider acute coronary syndrome vs non-cardiac etiology');
  }

  if (lowerNote.includes('hypertension') || lowerNote.includes('htn')) {
    points.push('Hypertension - review blood pressure control and medication adherence');
  }

  // Add context from search results
  if (searchResults.length > 0) {
    const categories = searchResults
      .map(r => r.document?.category)
      .filter(Boolean);

    if (categories.length > 0) {
      points.push(`Relevant guidelines found: ${categories.slice(0, 2).join(', ')}`);
    }
  }

  return points.length > 0 ? points : ['Clinical assessment in progress - complete documentation for detailed analysis'];
}

/**
 * Generate plan items from note (rule-based)
 * @param {string} note
 * @returns {string[]}
 */
function generatePlanItems(note) {
  const items = [];
  const lowerNote = note.toLowerCase();

  // Pattern-based plan generation
  if (lowerNote.includes('heart failure')) {
    items.push('Optimize GDMT: ACE-I/ARB/ARNI, beta-blocker, MRA, SGLT2i per guidelines');
    items.push('Monitor fluid status and daily weights');
    items.push('Cardiology follow-up in 2-4 weeks');
  }

  if (lowerNote.includes('atrial fibrillation') || lowerNote.includes('afib')) {
    items.push('Calculate CHA2DS2-VASc score and initiate/continue anticoagulation if indicated');
    items.push('Rate vs rhythm control strategy per patient characteristics');
  }

  if (lowerNote.includes('chest pain')) {
    items.push('Serial troponins and EKGs to rule out ACS');
    items.push('Risk stratification and stress testing as appropriate');
  }

  // Always include follow-up
  items.push('Continue current medications as prescribed');
  items.push('Patient education on warning signs and when to seek care');

  return items;
}

/**
 * Clear the analysis cache
 */
export function clearCache() {
  analysisCache.clear();
  console.log("[GPT-4] Cache cleared");
  // Also reset OpenAI client so it re-initializes after env/key rotation
  openai = null;
  initAttempted = false;
}
