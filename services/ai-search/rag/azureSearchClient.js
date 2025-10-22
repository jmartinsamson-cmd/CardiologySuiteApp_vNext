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
  const svc = process.env.AZURE_SEARCH_NAME;
  const idx = process.env.AZURE_SEARCH_INDEX || 'cardiology-index';
  const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY;
  const ver = process.env.AZURE_SEARCH_API_VERSION || '2024-07-01';
  const endpoint = svc ? `https://${svc}.search.windows.net` : null;
  
  return { svc, idx, apiKey, ver, endpoint };
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
      // Map to actual Azure Blob Storage index fields
      select: 'id,metadata_storage_name,content,metadata_storage_path,language,keyPhrases',
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
    // Map Azure Blob Storage index fields to expected structure
    const results = (data?.value || []).map((v) => ({
      id: v.id,
      title: v.metadata_storage_name || 'Untitled Document', // Use filename as title
      content: v.content || '',
      sourceId: v.id, // Use document id as sourceId
      url: v.metadata_storage_path || '', // Storage path as URL
      chunkIndex: 0, // Single-document index (no chunking configured)
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
