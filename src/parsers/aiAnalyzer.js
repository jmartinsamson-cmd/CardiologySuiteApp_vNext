/* eslint-env browser */
import { debugLog, debugWarn } from "../utils/logger.js";

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
 * Auto-detects Codespaces/dev container environment
 */
const AI_SERVER_URL = (() => {
  // In Codespaces, use relative path to leverage port forwarding
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('github.dev') || 
       window.location.hostname.includes('codespaces'))) {
    // Use same origin with different port - Codespaces handles forwarding
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // For GitHub Codespaces, construct the forwarded URL
    // Pattern: https://{codespace-name}-{port}.app.github.dev
    const match = hostname.match(/^(.+?)-\d+\.(.+)$/);
    if (match) {
      const baseUrl = `${protocol}//${match[1]}-8081.${match[2]}`;
      console.log('[AI Analyzer] Detected Codespaces, using:', baseUrl);
      return baseUrl;
    }
  }
  // Fallback to localhost for local development
  console.log('[AI Analyzer] Using localhost:', 'http://127.0.0.1:8081');
  return 'http://127.0.0.1:8081';
})();

/**
 * Enrich parsed note result with AI analysis
 * @param {any} baseResult - Base parser result (structure varies by parser)
 * @param {string} originalNote - Original note text
 * @returns {Promise<any>} Enriched result
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
    debugLog('[AI Analyzer] Calling analyze-note endpoint...');
    
    const response = await fetch(`${AI_SERVER_URL}/api/analyze-note`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note: originalNote })
    });
    
    if (!response.ok) {
      debugWarn('[AI Analyzer] Server returned error:', response.status);
      return baseResult;
    }
    
    const aiData = await response.json();
    
    // Check if response indicates failure
    if (aiData.ok === false) {
      debugWarn('[AI Analyzer] Analysis failed:', aiData.error);
      return baseResult;
    }
    
    debugLog('[AI Analyzer] Received AI analysis:', {
      assessment: aiData.assessment?.length || 0,
      plan: aiData.plan?.length || 0,
      citations: aiData.citations?.length || 0
    });
    
    // Format AI assessment and plan as text content (will be merged into sections)
    let assessmentText = '';
    if (Array.isArray(aiData.assessment) && aiData.assessment.length > 0) {
      assessmentText = aiData.assessment.map((/** @type {any} */ item, /** @type {number} */ i) => `${i + 1}. ${item}`).join('\n');
    }
    
    let planText = '';
    if (Array.isArray(aiData.plan) && aiData.plan.length > 0) {
      planText = aiData.plan.map((/** @type {any} */ item, /** @type {number} */ i) => `${i + 1}. ${item}`).join('\n');
    }
    
    // Create enriched result with AI metadata
    /** @type {any} */
    const enriched = {
      ...baseResult,
      // Keep original metadata for debugging/provenance
      assessment: Array.isArray(aiData.assessment) ? aiData.assessment : undefined,
      plan: Array.isArray(aiData.plan) ? aiData.plan : undefined,
      citations: Array.isArray(aiData.citations) ? aiData.citations : undefined,
      evidenceDocs: Array.isArray(aiData.evidenceDocs) ? aiData.evidenceDocs : undefined,
      source: aiData.source || undefined
    };
    
    // Inject AI content into sections for normalization
    // parseClinicalNoteFull returns {sections: {...}, ...}
    if (!enriched.sections) {
      enriched.sections = {};
    }
    
    // Only override ASSESSMENT and PLAN if AI generated meaningful content
    // AND if the base parser didn't find good content
    if (assessmentText) {
      const existingAssessment = enriched.sections.ASSESSMENT || enriched.sections['Impression and Plan'] || enriched.sections['Impression:'] || '';
      if (existingAssessment.length < 50) {
        enriched.sections.ASSESSMENT = assessmentText;
        debugLog('[AI Analyzer] Injected AI assessment into sections');
      }
    }
    
    if (planText) {
      const existingPlan = enriched.sections.PLAN || enriched.sections['Plan:'] || '';
      if (existingPlan.length < 50) {
        enriched.sections.PLAN = planText;
        debugLog('[AI Analyzer] Injected AI plan into sections');
      }
    }
    
    return enriched;
    
  } catch (/** @type {any} */ error) {
    // Fail silently - don't break existing flow
    debugWarn('[AI Analyzer] Analysis failed (continuing with base result):', error?.message || String(error));
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
