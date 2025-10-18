/* eslint-env node */
/* global process, require, module */
import dotenv from "dotenv";
import OpenAI from "openai";
import { LRUCache } from "lru-cache";
import crypto from "crypto";

// Load .env for Azure OpenAI credentials
dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21-preview";

if (!endpoint || !apiKey || !deployment) {
  throw new Error("Missing Azure OpenAI environment variables");
}

const openai = new OpenAI({
  apiKey,
  baseURL: `${endpoint}/openai/deployments/${deployment}`,
  defaultHeaders: {
    "api-key": apiKey,
    "azure-openai-api-version": apiVersion,
  },
});

// LRU Cache for repeated note analyses (max 100 entries, 1 hour TTL)
const analysisCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
  updateAgeOnGet: true,
});

/**
 * Calculate confidence score with multi-factor analysis
 * @param {any} parsed - Parsed AI response
 * @param {string} noteText - Original note text for context
 * @returns {number} Confidence score (0-1)
 */
function calculateConfidence(parsed, noteText) {
  let score = 0;
  const factors = [];

  // Factor 1: Completeness of clinical data (0-0.25)
  const hasVitals = /BP.*\d+\/\d+|HR.*\d+|RR.*\d+/i.test(noteText);
  const hasLabs = /BNP|troponin|creatinine|potassium/i.test(noteText);
  const hasEKG = /EKG|ECG|ST.*elevation|Q.*wave/i.test(noteText);
  const dataScore = (hasVitals ? 0.1 : 0) + (hasLabs ? 0.1 : 0) + (hasEKG ? 0.05 : 0);
  score += dataScore;
  factors.push(`Data completeness: ${dataScore.toFixed(2)}`);

  // Factor 2: Assessment quality (0-0.30)
  if (Array.isArray(parsed.assessment) && parsed.assessment.length > 0) {
    const hasEvidence = parsed.assessment.some(a => 
      typeof a === 'string' && (a.includes('given') || a.includes('based on') || a.includes('due to'))
    );
    const hasSeverity = parsed.assessment.some(a => 
      typeof a === 'string' && /acute|chronic|severe|mild|stable|unstable/i.test(a)
    );
    const assessmentScore = 0.15 + (hasEvidence ? 0.1 : 0) + (hasSeverity ? 0.05 : 0);
    score += assessmentScore;
    factors.push(`Assessment quality: ${assessmentScore.toFixed(2)}`);
  }

  // Factor 3: Plan specificity (0-0.25)
  if (Array.isArray(parsed.plan) && parsed.plan.length > 0) {
    const hasDosing = parsed.plan.some(p => typeof p === 'string' && /\d+\s*(mg|mcg|units|mL)/i.test(p));
    const hasTimeline = parsed.plan.some(p => typeof p === 'string' && /daily|q\d+h|PRN|STAT|urgent/i.test(p));
    const hasGuideline = parsed.plan.some(p => typeof p === 'string' && /ACC|AHA|ESC|guideline|class\s+[I]+/i.test(p));
    const planScore = 0.1 + (hasDosing ? 0.05 : 0) + (hasTimeline ? 0.05 : 0) + (hasGuideline ? 0.05 : 0);
    score += planScore;
    factors.push(`Plan specificity: ${planScore.toFixed(2)}`);
  }

  // Factor 4: Guideline support (0-0.20)
  if (Array.isArray(parsed.citations) && parsed.citations.length > 0) {
    const guidelineScore = Math.min(0.20, parsed.citations.length * 0.07);
    score += guidelineScore;
    factors.push(`Guideline support: ${guidelineScore.toFixed(2)}`);
  }

  // Factor 5: Clinical reasoning chain (0-0.10)
  if (parsed.reasoning && typeof parsed.reasoning === 'string' && parsed.reasoning.length > 50) {
    score += 0.10;
    factors.push('Reasoning provided: 0.10');
  }

  if (process.env.DEBUG_TELEMETRY === "true") {
    console.log('[Confidence Factors]:', factors.join(', '), '→', score.toFixed(2));
  }
  
  return Math.min(score, 1.0);
}

/**
 * Log telemetry data (latency, cache hit, confidence)
 * @param {string} operation
 * @param {any} data
 */
function logTelemetry(operation, data) {
  const telemetry = {
    timestamp: new Date().toISOString(),
    operation,
    ...data,
  };
  
  // Log to console (can be extended to Azure Application Insights)
  if (process.env.DEBUG_TELEMETRY === "true") {
    console.log("[TELEMETRY]", JSON.stringify(telemetry));
  }
  
  // TODO: Send to Azure Application Insights
  // trackEvent({ name: operation, properties: telemetry });
}

/**
 * Run parser and AI analyzer in parallel
 * @param {string} noteText
 * @param {Function} parserFn - Parser function to run concurrently
 * @param {{ useCache?: boolean }} options
 * @returns {Promise<{ parsed: any, analysis: any }>}
 */
export async function analyzeNoteParallel(noteText, parserFn, options = {}) {
  const startTime = Date.now();
  
  // Run parser and AI analysis concurrently
  const [parsed, analysis] = await Promise.all([
    parserFn(noteText),
    analyzeNote(noteText, options),
  ]);
  
  const totalLatency = Date.now() - startTime;
  
  logTelemetry("analyzeNoteParallel", {
    totalLatency,
    cached: analysis.cached,
    confidence: analysis.confidence,
  });
  
  return { parsed, analysis };
}

/**
 * Generate semantic hash for note (ignores formatting, whitespace, PHI)
 * @param {string} noteText - Raw note
 * @returns {string} Semantic hash
 */
function semanticHash(noteText) {
  // Normalize text
  const normalized = noteText
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  // Extract clinical entities only (ignore patient names, MRNs)
  const entities = [];
  
  // Extract vitals
  const vitalsMatch = normalized.match(/(?:bp|hr|rr|temp|o2sat|spo2)[:\s]*\d+/g);
  if (vitalsMatch) entities.push(...vitalsMatch);
  
  // Extract diagnosis/assessment
  const diagnosisMatch = normalized.match(/(?:assessment|diagnosis|impression)[:\s]*([^.]+)/);
  if (diagnosisMatch) entities.push(diagnosisMatch[1]);
  
  // Extract medications
  const medsMatch = normalized.match(/(?:medications|meds)[:\s]*([^.]+)/);
  if (medsMatch) entities.push(medsMatch[1]);
  
  // Extract labs
  const labsMatch = normalized.match(/(?:labs|laboratory)[:\s]*([^.]+)/);
  if (labsMatch) entities.push(labsMatch[1]);
  
  // Hash entity string
  const entityString = entities.sort().join('|');
  return crypto.createHash('sha256').update(entityString).digest('hex');
}

/**
 * Analyze a clinical note using Azure OpenAI GPT-4
 * @param {string} noteText
 * @param {{ useCache?: boolean; parallel?: boolean }} options
 * @returns {Promise<{ assessment: any[], plan: any[], citations: any[], confidence?: number, cached?: boolean, latency?: number }>} 
 */
export async function analyzeNote(noteText, options = {}) {
  const { useCache = true } = options;
  const startTime = Date.now();
  
  // Generate semantic cache key from clinical entities
  const cacheKey = semanticHash(noteText);
  
  // Check cache first
  if (useCache && analysisCache.has(cacheKey)) {
    const cached = /** @type {any} */ (analysisCache.get(cacheKey));
    return { ...cached, cached: true, latency: Date.now() - startTime };
  }
  
  // Enhanced prompt with clinical reasoning
  const systemPrompt = `You are an expert cardiologist with 20+ years of clinical experience. Analyze notes with:

CLINICAL REASONING RULES:
1. Extract ONLY explicitly stated findings - never infer unstated conditions
2. Use temporal reasoning (acute vs chronic presentations)
3. Consider differential diagnoses before final assessment
4. Flag incomplete data that affects clinical decisions
5. Prioritize life-threatening conditions (STEMI, PE, tamponade)

ASSESSMENT FORMAT:
- Primary diagnosis with supporting evidence
- Severity stratification (stable/unstable/critical)
- Risk factors and prognostic indicators
- Gaps in workup requiring additional data

PLAN FORMAT:
- STAT interventions if indicated
- Evidence-based therapies with guideline references (ACC/AHA class I-III)
- Monitoring parameters with target values
- Consultation triggers
- Disposition rationale

QUALITY CHECKS:
- Cross-validate vitals with assessment (e.g., hypotension + chest pain → cardiogenic shock?)
- Check medication dosing against renal function
- Verify anticoagulation safety (bleeding risk)
- Flag drug interactions

Return JSON:
{
  "assessment": ["diagnosis 1: rationale", "diagnosis 2: rationale"],
  "plan": ["action 1: class I recommendation (GUIDELINE)", "action 2: class IIa (GUIDELINE)"],
  "citations": [{"source": "guideline name", "evidence": "specific recommendation"}],
  "confidence": 0.0-1.0,
  "clinicalFlags": ["incomplete troponin series", "unknown baseline renal function"],
  "reasoning": "brief clinical reasoning chain"
}`;

  const prompt = `Analyze the following clinical note:\n\n${noteText}`;

  try {
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });
    const aiText = response.choices[0]?.message?.content || "";
    // Parse JSON from AI response
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch {
      // Fail-soft: return empty structure if parsing fails
      return { assessment: [], plan: [], citations: [], confidence: 0, cached: false, latency: Date.now() - startTime };
    }
    
    // Calculate confidence score with multi-factor analysis
    const confidence = calculateConfidence(parsed, noteText);
    const result = { ...parsed, confidence, cached: false, latency: Date.now() - startTime };
    
    // Log telemetry
    logTelemetry("analyzeNote", {
      latency: result.latency,
      confidence,
      cached: false,
      assessmentCount: parsed.assessment?.length || 0,
      planCount: parsed.plan?.length || 0,
      citationsCount: parsed.citations?.length || 0,
    });
    
    // Cache the result
    if (useCache) {
      analysisCache.set(cacheKey, result);
    }
    
    return result;
  } catch {
    // Fail-soft fallback: return empty structure
    const fallbackResult = { assessment: [], plan: [], citations: [], confidence: 0, cached: false, latency: Date.now() - startTime };
    
    logTelemetry("analyzeNote", {
      latency: fallbackResult.latency,
      confidence: 0,
      cached: false,
      error: true,
    });
    
    return fallbackResult;
  }
}

// Example usage (for testing)
if (require.main === module) {
  const testNote = "Patient presents with chest pain and history of hypertension. EKG shows ST elevation.";
  analyzeNote(testNote).then(result => {
    console.log("AI Analysis:", JSON.stringify(result, null, 2));
  });
}
