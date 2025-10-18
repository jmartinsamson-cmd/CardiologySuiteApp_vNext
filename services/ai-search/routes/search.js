/* eslint-env node */
/* global process */
import { normalizeHit, normalizeResultContainer } from "../helpers/search-normalize.js";
import { restSearch, hasEnumerableProps } from "../helpers/rest-search.js";
import { withBackoff } from "../helpers/retry.js";
import { recordRestFallback } from "../helpers/telemetry.js";

const MAX_TOP = 50;
const DEBUG = process.env.DEBUG_SEARCH === "true";

/**
 * @param {unknown} n
 */
function clampTop(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(1, Math.min(MAX_TOP, v)) : 10;
}

/**
 * @param {import("express").Application} app
 * @param {import("@azure/search-documents").SearchClient<any>} client
 * @param {{ endpoint: string; indexName: string; apiKey: string }} credentials
 */
export default function registerSearchRoutes(app, client, credentials) {
  // credentials are passed through to runSearch; no direct use here to avoid unused vars

  // GET /search?query=...&top=5&skip=0&select=field1,field2&orderby=...&filters=...&semantic=...&facets=f1,f2
  app.get("/search", async (req, res) => {
    const q = String(req.query.query ?? "");
    const top = clampTop(req.query.top);
    const skip = Number(req.query.skip ?? 0) || 0;
    const select = (req.query.select ? String(req.query.select) : "")
      .split(",")
      .filter(Boolean);
    const orderby = req.query.orderby ? String(req.query.orderby) : undefined;
    const filters = req.query.filters ? String(req.query.filters) : undefined;
    const semantic = req.query.semantic ? String(req.query.semantic) : undefined;
    const facets = req.query.facets ? String(req.query.facets).split(",").filter(Boolean) : undefined;

    await runSearch({ q, top, skip, select, orderby, filters, semantic, facets }, res, client, credentials);
  });

  // POST /search  { q, top, skip, select[], orderby, filters, semantic, vector, facets }
  app.post("/search", async (req, res) => {
    const {
      q = "",
      top = 10,
      skip = 0,
      select = [],
      orderby,
      filters,
      semantic,
      vector, // optional: { fields: "vectorField", k: 10, vector: number[] }
      facets, // optional: string[] of fields
    } = req.body || {};

    await runSearch({ q, top: clampTop(top), skip, select, orderby, filters, semantic, vector, facets }, res, client, credentials);
  });
}

/**
 * @param {{ q: string; top: number; skip: number; select: string[]; orderby?: string; filters?: string; semantic?: string; vector?: { vector: number[]; k?: number; fields: string }; facets?: string[] }} opts
 * @param {import('express').Response} res
 * @param {import("@azure/search-documents").SearchClient<any>} client
 * @param {{ endpoint: string; indexName: string; apiKey: string }} credentials
 */
async function runSearch(opts, res, client, credentials) {
  try {
    const { q, top, skip, select, orderby, filters, semantic, vector, facets } = opts;
    const { endpoint, indexName, apiKey } = credentials;

    /** @type {any} */
    const searchOptions = {
      top,
      skip,
      select: Array.isArray(select) && select.length ? select : undefined,
      orderBy: orderby ? [orderby] : undefined,
      filter: filters || undefined,
      includeTotalCount: true,
      facets,
    };

    // Semantic ranking (if configured)
    if (semantic) {
      searchOptions.queryType = "semantic";
      searchOptions.semanticConfiguration = semantic;
      searchOptions.captions = "extractive";
      searchOptions.answers = "extractive|count-3";
    }

    // Vector/hybrid
    /** @type {any} */
    let iteratorOrObject;
    if (vector && Array.isArray(vector.vector) && vector.vector.length && vector.fields) {
      searchOptions.vector = {
        value: vector.vector,
        kNearestNeighborsCount: Number(vector.k ?? top),
        fields: vector.fields,
      };
      iteratorOrObject = client.search(q, searchOptions);
    } else {
      iteratorOrObject = client.search(q, searchOptions);
    }

    const rows = [];

    // Try byPage first for a consistent first-page shape across SDKs
    if (iteratorOrObject && typeof /** @type {any} */ (iteratorOrObject).byPage === "function") {
      try {
        const pager = /** @type {any} */ (iteratorOrObject).byPage({ maxPageSize: top });
        const first = await pager.next();
        const page = first?.value;
        if (Array.isArray(page)) {
          rows.push(...page);
        } else if (page && Array.isArray(page.results)) {
          rows.push(...page.results);
        } else if (page && Array.isArray(page.value)) {
          rows.push(...page.value);
        }
      } catch {
        // ignore and fall back
      }
    }

    // Fallback: iterate over hits
    if (rows.length === 0 && iteratorOrObject && typeof /** @type {any} */ (iteratorOrObject)[Symbol.asyncIterator] === "function") {
      let i = 0;
      for await (const hit of iteratorOrObject) {
        rows.push(hit);
        if (++i >= top) break;
      }
    }

    // Final fallback: attempt to normalize as a container
    if (rows.length === 0) {
      rows.push(...normalizeResultContainer(iteratorOrObject));
    }

    // SDK fallback to REST API if we still have no results
    if (rows.length === 0 && !hasEnumerableProps(iteratorOrObject)) {
      if (DEBUG) console.log("[search] SDK returned empty proxy, falling back to REST API");
      try {
        const restResult = await withBackoff(() => restSearch(endpoint, indexName, apiKey, q || "*", {
          top,
          skip,
          select,
          orderby,
          filters,
          semantic,
          includeTotalCount: true,
        }));
        
        // REST API returns { value: [...], @odata.count: N }
        if (restResult && Array.isArray(restResult.value)) {
          rows.push(...restResult.value);
        }
        try { recordRestFallback(); } catch (err) {
          if (DEBUG) console.log("[search] recordRestFallback failed", /** @type {any} */(err)?.message || err);
        }
        
        const restCount = restResult?.["@odata.count"] ?? restResult?.count;
        const results = rows.map(normalizeHit);
        return res.json({ 
          ok: true, 
          count: restCount ?? results.length, 
          results, 
          diagnostics: { top, skip, semantic: !!semantic, hybrid: !!vector, method: "REST" } 
        });
      } catch (restErr) {
        if (DEBUG) console.error("[search] REST fallback failed:", restErr);
        // Continue to normal response with empty results
      }
    }

    let total =
      /** @type {any} */ (iteratorOrObject)?.count ??
      undefined;

    // If total is undefined, try to infer from first page
    if (total == null && iteratorOrObject && typeof /** @type {any} */ (iteratorOrObject).byPage === "function") {
      try {
        const pager = /** @type {any} */ (iteratorOrObject).byPage({ maxPageSize: 1 });
        const first = await pager.next();
        const page = first?.value;
        if (page) {
          total = page.count ?? page.totalCount ?? page["@odata.count"];
        }
      } catch {
        // ignore
      }
    }

    const results = rows.map(normalizeHit);
    res.json({ ok: true, count: total ?? results.length, results, diagnostics: { top, skip, semantic: !!semantic, hybrid: !!vector } });
  } catch (/** @type {any} */ e) {
    res.status(500).json({ ok: false, code: e?.statusCode ?? e?.code, error: e?.message || String(e) });
  }
}
