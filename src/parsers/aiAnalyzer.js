/* eslint-env browser */
/**
 * AI Note Analyzer - Client-side integration
 * 
 * Enriches parsed clinical notes with AI-generated assessment, plan, and citations
 * by calling the /api/analyze-note endpoint. Fail-soft design ensures existing
 * parsing flow is not disrupted if AI analysis fails.
 */

/**
 * Feature flag for AI analysis (can be toggled via config)
 */
const USE_AI_ANALYZER = true;

/**
 * Server endpoint configuration
 */
const AI_SERVER_URL = 'http://127.0.0.1:8081';

/**
 * Enrich parsed note result with AI analysis
 * @param {import('./smartParser.js').ParseResult} baseResult - Base parser result
 * @param {string} originalNote - Original note text
 * @returns {Promise<import('./smartParser.js').ParseResult>} Enriched result
 */
export async function enrichWithAIAnalysis(baseResult, originalNote) {
  // Skip if feature disabled
  if (!USE_AI_ANALYZER) {
    return baseResult;
  }
  
  // Skip if note is too short (< 100 chars)
  if (!originalNote || originalNote.length < 100) {
    return baseResult;
  }
  
  try {
    console.log('[AI Analyzer] Calling analyze-note endpoint...');
    
    const response = await fetch(`${AI_SERVER_URL}/api/analyze-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note: originalNote })
    });
    
    if (!response.ok) {
      console.warn('[AI Analyzer] Server returned error:', response.status);
      return baseResult;
    }
    
    const aiData = await response.json();
    
    // Check if response indicates failure
    if (aiData.ok === false) {
      console.warn('[AI Analyzer] Analysis failed:', aiData.error);
      return baseResult;
    }
    
    console.log('[AI Analyzer] Received AI analysis:', {
      assessment: aiData.assessment?.length || 0,
      plan: aiData.plan?.length || 0,
      citations: aiData.citations?.length || 0
    });
    
    // Merge AI data with base result (non-destructive)
    const enriched = {
      ...baseResult,
      assessment: Array.isArray(aiData.assessment) ? aiData.assessment : undefined,
      plan: Array.isArray(aiData.plan) ? aiData.plan : undefined,
      citations: Array.isArray(aiData.citations) ? aiData.citations : undefined
    };
    
    return enriched;
    
  } catch (/** @type {any} */ error) {
    // Fail silently - don't break existing flow
    console.warn('[AI Analyzer] Analysis failed (continuing with base result):', error?.message || String(error));
    return baseResult;
  }
}

/**
 * Check if AI analyzer is available
 * @returns {Promise<boolean>}
 */
export async function checkAIAnalyzerAvailability() {
  if (!USE_AI_ANALYZER) {
    return false;
  }
  
  try {
    const response = await fetch(`${AI_SERVER_URL}/health`, {
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Attach to window for global access (following project pattern)
if (typeof window !== 'undefined') {
  /** @type {any} */ (window).enrichWithAIAnalysis = enrichWithAIAnalysis;
  /** @type {any} */ (window).checkAIAnalyzerAvailability = checkAIAnalyzerAvailability;
}
