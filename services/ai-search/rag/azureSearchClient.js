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

// Azure Search configuration
const svc = process.env.AZURE_SEARCH_NAME;
const idx = process.env.AZURE_SEARCH_INDEX || 'cardiology-index';
const apiKey = process.env.AZURE_SEARCH_ADMIN_KEY;
const ver = process.env.AZURE_SEARCH_API_VERSION || '2024-07-01';
const endpoint = svc ? `https://${svc}.search.windows.net` : null;

/**
 * Search cardiology guidelines and educational materials
 * @param {string} query - Clinical query (diagnoses, meds, labs)
 * @param {number} [top=5] - Number of results to retrieve
 * @returns {Promise<RetrievedDoc[]>} Retrieved documents with relevance scores
 */
export async function searchGuidelines(query, top = 5) {
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
      select: 'id,title,content,sourceId,url,chunkIndex',
      // Optional: add vectorQueries if you have embeddings configured
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
    const results = (data?.value || []).map((v) => ({
      id: v.id,
      title: v.title,
      content: v.content,
      sourceId: v.sourceId,
      url: v.url,
      chunkIndex: v.chunkIndex,
      score: v['@search.score']
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
  return {
    configured: !!(endpoint && apiKey),
    endpoint: endpoint || '(not set)',
    index: idx,
    apiVersion: ver
  };
}
