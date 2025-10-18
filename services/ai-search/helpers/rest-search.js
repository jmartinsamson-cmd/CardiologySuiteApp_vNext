/* eslint-env node */

/**
 * REST API fallback for Azure Search when SDK returns empty results
 * @param {string} endpoint - Azure Search endpoint URL
 * @param {string} indexName - Index name
 * @param {string} apiKey - Query API key
 * @param {string} query - Search query
 * @param {any} options - Search options
 */
export async function restSearch(endpoint, indexName, apiKey, query, options = {}) {
  const { top = 10, skip = 0, select, orderby, filters, semantic, includeTotalCount = true } = options;
  
  const apiVersion = "2024-07-01";
  const url = `${endpoint}/indexes/${indexName}/docs/search?api-version=${apiVersion}`;
  
  /** @type {any} */
  const body = {
    search: query || "*",
    top,
    skip,
    count: includeTotalCount,
  };
  
  if (select && Array.isArray(select) && select.length) {
    body.select = select.join(",");
  }
  
  if (orderby) {
    body.orderby = orderby;
  }
  
  if (filters) {
    body.filter = filters;
  }
  
  // Semantic search configuration
  if (semantic) {
    body.queryType = "semantic";
    body.semanticConfiguration = semantic;
    body.captions = "extractive";
    body.answers = "extractive|count-3";
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`REST search failed ${response.status}: ${text}`);
    // @ts-ignore augment error with status for retry filter
    err.status = response.status;
    throw err;
  }
  
  const json = await response.json();
  return json;
}

/**
 * Check if an object has any enumerable properties
 * @param {any} obj
 */
export function hasEnumerableProps(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).length > 0;
}
