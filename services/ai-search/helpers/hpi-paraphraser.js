/* eslint-env node */
/* global process, console, fetch */

/**
 * HPI Paraphraser with Auto-Discovery
 * 
 * Robust HPI paraphrasing that:
 * 1. Tries configured deployment first
 * 2. Auto-discovers usable GPT-4-mini/4o deployments on 404/400
 * 3. Caches working deployment for session
 * 4. Falls back to rule-based paraphrasing gracefully
 */

import { withBackoff } from "./retry.js";
import { logAIEvent } from "./telemetry.js";

// --- Configuration & State ---
let endpoint = (process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_ENDPOINT || '').replace(/\/$/, '');
const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || process.env.OPENAI_API_VERSION || '2024-02-15-preview';

// Ensure endpoint is a complete URL
if (endpoint && !endpoint.startsWith('http')) {
  endpoint = `https://${endpoint}`;
}

console.log(`[HPI] Initialized with endpoint: ${endpoint || '(empty)'}, apiKey: ${apiKey ? '***SET***' : '(empty)'}`);

/** @type {string} Session cache for working HPI deployment */
let cachedHpiDeployment = process.env.AZURE_OPENAI_HPI_DEPLOYMENT || '';

/** @type {boolean} Flag to prevent repeated discovery attempts */
let discoveryAttempted = false;

// Prefer deployment names that look like GPT-4o-mini / GPT-4-mini-ish chat models
const PREFERRED_DEPLOYMENT_SUBSTRINGS = [
  'gpt-4o-mini', 'gpt-4o-mini-',
  'gpt-4o', 'gpt-4o-',
  'gpt-4-mini', 'gpt-4.1-mini', 'gpt-4.1',
  'gpt-4', 'gpt-35-turbo' // fallback to GPT-3.5 if needed
];

/**
 * Get headers for Azure OpenAI API
 * @returns {Record<string, string>}
 */
function headers() {
  return { 
    'Content-Type': 'application/json', 
    'api-key': apiKey 
  };
}

/**
 * Resolve HPI deployment name with auto-discovery
 * 
 * Strategy:
 * 1. Return cached deployment if available
 * 2. Try env-configured deployment first
 * 3. Auto-discover from Azure OpenAI deployments list
 * 4. Cache and return working deployment
 * 
 * @returns {Promise<string>} Deployment name or empty string
 */
async function resolveHpiDeployment() {
  // Return cached if we've already found one
  if (cachedHpiDeployment && discoveryAttempted) {
    return cachedHpiDeployment;
  }

  // 1) If env is set, test it with a quick probe
  const envName = process.env.AZURE_OPENAI_HPI_DEPLOYMENT;
  if (envName && !discoveryAttempted) {
    console.log(`[HPI] Testing configured deployment: ${envName}`);
    const ok = await probeDeployment(envName);
    if (ok) {
      console.log(`[HPI] ✓ Configured deployment ${envName} is working`);
      cachedHpiDeployment = envName;
      discoveryAttempted = true;
      return envName;
    }
    console.warn(`[HPI] ✗ Configured deployment ${envName} not responding`);
  }

  // 2) Auto-discover deployments
  if (!discoveryAttempted) {
    discoveryAttempted = true;
    try {
      console.log('[HPI] Starting auto-discovery of deployments...');
      const url = `${endpoint}/openai/deployments?api-version=${apiVersion}`;
      console.log(`[HPI] Discovery URL: ${url}`);
      const res = await fetch(url, { 
        method: 'GET', 
        headers: headers() 
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[HPI] Failed to list deployments: ${res.status} ${errorText}`);
        return cachedHpiDeployment = envName || '';
      }

      const data = await res.json();
      // Azure OpenAI returns { data: [{id, model, ...}] }
      const items = Array.isArray(data?.data) ? data.data : [];
      
      if (items.length === 0) {
        console.warn('[HPI] No deployments found in Azure OpenAI');
        return cachedHpiDeployment = envName || '';
      }

      console.log(`[HPI] Found ${items.length} deployment(s), ranking by preference...`);

      // Rank deployments by preferred substrings
      const rank = (name, model) => {
        const haystack = `${name} ${model || ''}`.toLowerCase();
        const score = PREFERRED_DEPLOYMENT_SUBSTRINGS.reduce(
          (acc, substring) => haystack.includes(substring) ? acc + 1 : acc,
          0
        );
        return score;
      };

      // Sort by rank (highest first)
      items.sort((a, b) => {
        const rankA = rank(a?.name || a?.id || '', a?.model || '');
        const rankB = rank(b?.name || b?.id || '', b?.model || '');
        return rankB - rankA;
      });

      // Try top-ranked deployments
      for (const item of items.slice(0, 3)) { // Try top 3
        const name = item?.name || item?.id;
        if (!name) continue;

        console.log(`[HPI] Probing deployment: ${name} (model: ${item?.model || 'unknown'})`);
        const ok = await probeDeployment(name);
        if (ok) {
          console.log(`[HPI] ✓ Auto-selected deployment: ${name}`);
          cachedHpiDeployment = name;
          return name;
        }
      }

      console.warn('[HPI] No suitable deployment found; using rule-based fallback');
      return cachedHpiDeployment = envName || '';

    } catch (err) {
      console.warn('[HPI] Discovery error:', /** @type {any} */(err)?.message || err);
      return cachedHpiDeployment = envName || '';
    }
  }

  return cachedHpiDeployment || '';
}

/**
 * Probe a deployment to see if it responds
 * @param {string} name - Deployment name
 * @returns {Promise<boolean>} True if deployment responds
 */
async function probeDeployment(name) {
  try {
    const url = `${endpoint}/openai/deployments/${encodeURIComponent(name)}/chat/completions?api-version=${apiVersion}`;
    const body = {
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1,
      temperature: 0
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });

    return res.ok;
  } catch (err) {
    console.warn(`[HPI] Probe failed for ${name}:`, /** @type {any} */(err)?.message || err);
    return false;
  }
}

/**
 * De-identify HPI text (basic PHI removal)
 * @param {string} text - Raw HPI text
 * @returns {string} De-identified text
 */
function deidentify(text) {
  // Basic de-identification patterns
  let cleaned = text;

  // Remove potential dates (MM/DD/YYYY, MM-DD-YYYY)
  cleaned = cleaned.replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g, '[DATE]');
  
  // Remove phone numbers
  cleaned = cleaned.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  
  // Remove email addresses
  cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remove SSN patterns
  cleaned = cleaned.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  
  // Remove MRN patterns (common formats)
  cleaned = cleaned.replace(/\b(MRN|mrn|Medical Record #?):?\s*\d+\b/gi, '[MRN]');
  
  return cleaned;
}

/**
 * Rule-based paraphrase fallback
 * @param {string} text - HPI text
 * @returns {string} Paraphrased text
 */
function ruleBasedParaphrase(text) {
  // Simple rule-based paraphrasing
  let result = text;

  // Convert first-person to third-person
  result = result.replace(/\bI\b/g, 'Patient');
  result = result.replace(/\bmy\b/gi, 'their');
  result = result.replace(/\bme\b/gi, 'them');

  // Add professional tone
  result = result.replace(/^/, 'Patient reports ');
  
  // Clean up double spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Paraphrase HPI with auto-discovery and graceful fallback
 * 
 * @param {string} rawHpi - Raw HPI text
 * @returns {Promise<{ok: boolean, paraphrased: string, source: 'ai'|'rules', deployment?: string}>}
 */
export async function paraphraseHPI(rawHpi) {
  // De-identify and truncate
  const text = deidentify(rawHpi).slice(0, 8000);

  // Resolve deployment (cached after first call)
  const deploymentName = await resolveHpiDeployment();

  if (!deploymentName || !endpoint || !apiKey) {
    console.warn('[HPI] No deployment name resolved or missing credentials; using rule-based paraphrase');
    return {
      ok: true,
      paraphrased: ruleBasedParaphrase(text),
      source: 'rules'
    };
  }

  try {
    const url = `${endpoint}/openai/deployments/${encodeURIComponent(deploymentName)}/chat/completions?api-version=${apiVersion}`;
    const systemPrompt = 'Paraphrase clinically; concise, accurate; no fabrication; preserve time course.';
    
    const body = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
      max_tokens: 1000
    };

    const startTime = Date.now();
    const res = await withBackoff(
      async () => fetch(url, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body)
      }),
      {
        retries: 2,
        baseMs: 500,
        maxMs: 5000,
        retryOn: (err) => {
          const status = err?.status || err?.response?.status;
          return status === 429 || (status >= 500 && status < 600);
        }
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[HPI] Paraphrase HTTP ${res.status}: ${errorText}`);
      
      // On 404, clear cache to force re-discovery on next call
      if (res.status === 404) {
        console.warn('[HPI] Deployment not found (404), clearing cache for re-discovery');
        cachedHpiDeployment = '';
        discoveryAttempted = false;
      }
      
      // Log error event
      logAIEvent('paraphrase_hpi_error', {
        errorStatus: res.status,
        deploymentName
      });

      return {
        ok: true,
        paraphrased: ruleBasedParaphrase(text),
        source: 'rules'
      };
    }

    const data = await res.json();
    const paraphrased = data?.choices?.[0]?.message?.content?.trim() || ruleBasedParaphrase(text);
    const latency = Date.now() - startTime;

    // Log success event
    logAIEvent('paraphrase_hpi', {
      originalLength: rawHpi.length,
      paraphrasedLength: paraphrased.length,
      latencyMs: latency,
      deployment: deploymentName
    });

    return {
      ok: true,
      paraphrased,
      source: 'ai',
      deployment: deploymentName
    };

  } catch (err) {
    console.warn('[HPI] Paraphrase error:', /** @type {any} */(err)?.message || err);
    
    logAIEvent('paraphrase_hpi_error', {
      errorMessage: /** @type {any} */(err)?.message || 'Unknown error'
    });

    return {
      ok: true,
      paraphrased: ruleBasedParaphrase(text),
      source: 'rules'
    };
  }
}

/**
 * Get the currently active HPI deployment name (for diagnostics)
 * @returns {string} Deployment name or empty string
 */
export function getActiveHpiDeployment() {
  return cachedHpiDeployment || '';
}

/**
 * Get HPI paraphrasing status for diagnostics
 * @returns {{ deployment: string, source: 'ai'|'rules'|'unconfigured' }}
 */
export function getHpiStatus() {
  if (!endpoint || !apiKey) {
    return { deployment: '', source: 'unconfigured' };
  }
  
  if (cachedHpiDeployment) {
    return { deployment: cachedHpiDeployment, source: 'ai' };
  }
  
  return { deployment: '', source: 'rules' };
}
