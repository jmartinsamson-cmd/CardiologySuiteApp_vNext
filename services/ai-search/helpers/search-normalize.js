// helpers/search-normalize.js
// JS version of the provided TypeScript snippet

function extractDoc(hit) {
  if (hit && typeof hit.document === "object") return hit.document;
  if (hit && typeof hit._source === "object") return hit._source;
  if (hit && typeof hit.documentFields === "object") return hit.documentFields;
  const { ["@search.score"]: _ignored, ...rest } = hit || {};
  return rest && typeof rest === "object" ? rest : {};
}

function extractScore(hit) {
  if (hit && typeof hit.score === "number") return hit.score;
  if (hit && typeof hit._score === "number") return hit._score;
  if (hit && typeof hit["@search.score"] === "number") return hit["@search.score"];
  return undefined;
}

function extractId(doc) {
  return doc?.id ?? doc?.key ?? doc?.documentId ?? doc?.["@search.documentId"] ?? doc?._id;
}

export function normalizeHit(hit) {
  const doc = extractDoc(hit);
  const score = extractScore(hit);
  const id = extractId(doc);
  return { id, score, ...doc };
}

export function normalizeResultContainer(r) {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.results)) return r.results;
  if (Array.isArray(r?.value)) return r.value;
  if (Array.isArray(r?.hits)) return r.hits;
  return [];
}
