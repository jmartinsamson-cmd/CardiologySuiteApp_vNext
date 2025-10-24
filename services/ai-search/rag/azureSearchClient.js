/* eslint-env node */
/* global process, console, fetch */

/**
 * @file Azure Search Client for RAG (Retrieval-Augmented Generation)
 * Retrieves educational materials from cardiology-index for grounding clinical analysis
 */

import 'dotenv/config';

/**
 * @typedef {Object} RetrievedDoc
 * @property {string} id - Document ID
 * @property {string} [title] - Document title
 * @property {string} content - Document content/text
 * @property {string} [sourceId] - Source identifier
 * @property {string} [url] - Document URL
 * @property {number} [chunkIndex] - Chunk index if document is split
 * @property {number} [score] - Search relevance score
 */

/**
 * Get Azure Search configuration (lazy loading to ensure env vars are available)
 * @returns {Object} Configuration object
 */
function getConfig() {
  // Prefer explicit endpoint over constructed from service name
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT || 
    (process.env.AZURE_SEARCH_SERVICE_NAME 
      ? `https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`
      : null);
  
  const idx = process.env.AZURE_SEARCH_INDEX || 'cardiology-index';
  const apiKey = process.env.AZURE_SEARCH_API_KEY || process.env.AZURE_SEARCH_ADMIN_KEY;
  const ver = process.env.AZURE_SEARCH_API_VERSION || '2024-07-01';
  
  return { endpoint, idx, apiKey, ver };
}

/**
 * Search cardiology guidelines and educational materials
 * @param {string} query - Clinical query (diagnoses, meds, labs)
 * @param {{ topK?: number } | number} [options=5] - Options object with topK, or number for backward compatibility
 * @returns {Promise<RetrievedDoc[]>} Retrieved documents with relevance scores
 */
export async function searchGuidelines(query, options = 5) {
  // Support both old signature (query, number) and new signature (query, {topK})
  const top = typeof options === 'number' ? options : (options?.topK || 5);
  const { endpoint, apiKey, idx, ver } = getConfig();
  
  if (!endpoint || !apiKey) {
    console.warn('[RAG] Azure Search not configured, skipping retrieval');
    return [];
  }

  if (!query || query.trim().length === 0) {
    console.warn('[RAG] Empty query, skipping retrieval');
    return [];
  }

  try {
    const body = {
      search: query,
      searchMode: 'any',
      queryType: 'simple',
      top,
      // Do not use $select to maximize compatibility across index schemas
      // (blob indexers expose metadata_storage_*; custom indexes expose title/url/etc.)
      vectorQueries: [],
      semanticConfiguration: undefined
    };

    const url = `${endpoint}/indexes/${idx}/docs/search?api-version=${ver}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[RAG] Search failed: ${res.status} ${res.statusText}`, errorText);
      return [];
    }

    const data = await res.json();
    // Map to a common shape regardless of index schema
    const results = (data?.value || []).map((v) => ({
      id: v.id,
      title: v.title || v.metadata_storage_name || 'Untitled Document',
      content: v.content || v.text || '',
      sourceId: v.sourceId || v.id,
      url: v.url || v.metadata_storage_path || '',
      chunkIndex: typeof v.chunkIndex === 'number' ? v.chunkIndex : 0,
      score: v['@search.score'],
      language: v.language,
      keyPhrases: v.keyPhrases || []
    }));

    console.log(`[RAG] Retrieved ${results.length} documents for query: "${query.slice(0, 100)}..."`);
    return results;
  } catch (error) {
    console.error('[RAG] Search error:', error.message);
    return [];
  }
}

/**
 * Get Azure Search configuration status
 * @returns {Object} Configuration status
 */
export function getSearchStatus() {
  const { endpoint, apiKey, idx, ver } = getConfig();
  
  return {
    configured: !!(endpoint && apiKey),
    endpoint: endpoint || '(not set)',
    index: idx,
    apiVersion: ver
  };
}
