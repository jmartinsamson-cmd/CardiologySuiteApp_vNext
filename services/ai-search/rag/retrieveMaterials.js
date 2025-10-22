/* eslint-env node */
/* global process, console */

/**
 * @file Retrieval wrapper for RAG (Retrieval-Augmented Generation)
 * Deduplicates, truncates, and formats retrieved evidence for model grounding
 */

import { searchGuidelines } from './azureSearchClient.js';

const MAX_CHARS = parseInt(process.env.RAG_MAX_CHARS || '12000', 10);
const TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10);

/**
 * @typedef {Object} Evidence
 * @property {string} [title] - Document title
 * @property {string} snippet - Content snippet
 * @property {string} [sourceId] - Source identifier
 * @property {string} [url] - Document URL
 */

/**
 * Retrieve and deduplicate evidence from Azure Search
 * @param {string} query - Clinical query
 * @returns {Promise<Evidence[]>} Deduplicated evidence snippets
 */
export async function retrieveEvidence(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const hits = await searchGuidelines(query, TOP_K);
  const seen = new Set();
  const out = [];

  for (const h of hits) {
    // Deduplicate by title + sourceId combination
    const key = `${(h.title || '').toLowerCase()}|${h.sourceId || ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    // Truncate each document to a fair share of MAX_CHARS
    const snippet = String(h.content || '').slice(0, Math.ceil(MAX_CHARS / TOP_K));
    out.push({
      title: h.title,
      snippet,
      sourceId: h.sourceId,
      url: h.url
    });
  }

  console.log(`[RAG] Retrieved ${out.length} unique evidence documents (${hits.length} total hits)`);
  return out;
}

/**
 * Concatenate evidence into a single context string for model grounding
 * @param {Evidence[]} evs - Evidence documents
 * @returns {string} Formatted context string with markdown headers and separators
 */
export function concatEvidence(evs) {
  let acc = '';

  for (const e of evs) {
    const header = e.title ? `# ${e.title}\n` : '';
    const block = `${header}${e.snippet}\n\n---\n`;

    // Stop if we exceed MAX_CHARS
    if ((acc.length + block.length) > MAX_CHARS) {
      console.log(`[RAG] Reached MAX_CHARS limit (${MAX_CHARS}), stopping at ${acc.length} chars`);
      break;
    }

    acc += block;
  }

  console.log(`[RAG] Concatenated ${evs.length} evidence documents into ${acc.length} chars`);
  return acc;
}

/**
 * Build a clinical query from parsed note components
 * @param {Object} parsed - Parsed note data
 * @returns {string} Clinical query string
 */
export function buildClinicalQuery(parsed) {
  if (!parsed) {
    return '';
  }

  const parts = [];

  // Diagnoses (top 8)
  const dx = (parsed.diagnoses || []).slice(0, 8).join(', ');
  if (dx) {
    parts.push(`diagnoses: ${dx}`);
  }

  // Medications (top 10)
  const meds = (parsed.medications || []).slice(0, 10).join(', ');
  if (meds) {
    parts.push(`medications: ${meds}`);
  }

  // Labs (top 12, format as name:value)
  const labs = (parsed.labs || [])
    .slice(0, 12)
    .map((l) => `${l.name}:${l.value}`)
    .join(', ');
  if (labs) {
    parts.push(`labs: ${labs}`);
  }

  const query = parts.join(' | ');
  console.log(`[RAG] Built clinical query: "${query.slice(0, 200)}..."`);
  return query;
}
