/* eslint-env node */
/* global process, console, URL */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import fs from "fs";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import registerSearchRoutes from "./routes/search.js";
import registerAnalyzeNoteRoutes from "./routes/analyze-note.js";
import registerParaphraseHPIRoutes from "./routes/paraphrase-hpi.js";
import registerMedicalQARoutes from "./routes/medical-qa.js";
import { initTelemetry } from "./helpers/telemetry.js";
import { clearCache } from "./helpers/gpt4-analyzer.js";
import { liveHealthSuccess, liveHealthFailure, liveHealthDuration, metricsText } from "./helpers/metrics.js";
import { getHpiStatus } from "./helpers/hpi-paraphraser.js";

// Load .env: prefer repository root, fallback to local service folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Support both current layout (services/ai-search) and future (services/ai-search)
const envCandidates = [
  path.resolve(__dirname, "../../..", ".env"), // when located at services/ai-search
  path.resolve(__dirname, "../..", ".env"),   // when located at services/ai-search
  path.resolve(process.cwd(), ".env"),          // cwd fallback
  path.resolve(__dirname, ".env"),              // local folder fallback
];
const envPath = envCandidates.find(p => fs.existsSync(p)) || envCandidates[0];
console.log("[ai-search] Loading .env from:", envPath, "exists=", fs.existsSync(envPath));
// Force reload with override to fix dotenv v17 auto-injection issues
dotenv.config({ path: envPath, override: true });

// Initialize telemetry (no-op if not configured)
initTelemetry();

const app = express();

// ---- CORS (environment-based allowlist) ----
// Allow environment variable to override defaults (comma-separated list)
const defaultOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:5173",  // Vite default
      "http://localhost:5500",  // Five Server
      "http://localhost:4280",  // SWA CLI
      "http://127.0.0.1:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:4280",
    ];

if (process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
  defaultOrigins.push(`https://${process.env.CODESPACE_NAME}-${process.env.PORT || 8080}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
}
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const corsAllowlist = new Set([...defaultOrigins, ...allowedOrigins]);
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow same-origin/no-origin requests (curl)
    if (corsAllowlist.has(origin)) return callback(null, true);
    
    // Allow any GitHub Codespaces origin (dynamic port forwarding)
    if (origin && (origin.includes('.github.dev') || origin.includes('.githubpreview.dev'))) {
      console.log('[CORS] Allowing Codespaces origin:', origin);
      return callback(null, true);
    }
    
    console.log('[CORS] Blocked origin:', origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

// ---- ENV VARS ----
// Debug: Check what env vars are actually loaded
console.log("[ai-search] DEBUG - AZURE_SEARCH_ENDPOINT raw:", JSON.stringify(process.env.AZURE_SEARCH_ENDPOINT));
console.log("[ai-search] DEBUG - All AZURE_SEARCH keys:", Object.keys(process.env).filter(k => k.startsWith('AZURE_SEARCH')));

const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
const indexName = process.env.AZURE_SEARCH_INDEX;
const apiKey = process.env.AZURE_SEARCH_QUERY_KEY;
const LIVE_HEALTH_TOKEN = process.env.LIVE_HEALTH_TOKEN;
const healthMode = (process.env.HEALTH_CHECK_MODE || "static").toLowerCase(); // "static" | "live"

// Helper: summarize proxy env for diagnostics without leaking credentials
function summarizeProxyEnv() {
  const hp = process.env.HTTP_PROXY || process.env.http_proxy || "";
  const hsp = process.env.HTTPS_PROXY || process.env.https_proxy || "";
  const np = process.env.NO_PROXY || process.env.no_proxy || "";

  /**
   * @param {string} p
   */
  function fmt(p) {
    if (!p) return "<not set>";
    try {
      const u = new URL(p);
      return `${u.protocol}//${u.hostname}${u.port ? ":" + u.port : ""}`;
    } catch {
      // Not a valid URL, avoid printing whole string
      return "<set>";
    }
  }

  return {
    HTTP_PROXY: fmt(hp),
    HTTPS_PROXY: fmt(hsp),
    NO_PROXY: np ? "<set>" : "<not set>",
  };
}

// Startup diagnostics
console.log("[ai-search] Effective Azure Search endpoint:", endpoint || "<missing>");
console.log("[ai-search] Effective Azure Search index:", indexName || "<missing>");
console.log("[ai-search] Health check mode:", healthMode);
console.log("[ai-search] Proxy env:", summarizeProxyEnv());

if (!endpoint || !indexName || !apiKey) {
  console.error("❌ Missing Azure Search credentials in .env", {
    endpointPresent: !!endpoint,
    indexPresent: !!indexName,
    keyPresent: !!apiKey,
  });
  process.exit(1);
}

const credential = new AzureKeyCredential(apiKey);
let client = new SearchClient(endpoint, indexName, credential);

// ---- ROUTES ----

// Root route
app.get("/", (_req, res) => {
  res
    .type("text/plain")
    .send("✅ AI Search API is running.\n\nUse:\nGET /health\nPOST /search");
});

// Health check - default to 'static' to avoid masking proxy/TLS issues
// HEALTH_CHECK_MODE=live will perform an actual Azure Search call
app.get("/health", async (req, res) => {
  const qsMode = (req.query?.mode || "").toString().toLowerCase();
  const effectiveMode = qsMode === "live" ? "live" : qsMode === "static" ? "static" : (healthMode === "live" ? "live" : "static");

  if (effectiveMode !== "live") {
    const hpiStatus = getHpiStatus();
    return res.json({
      ok: true,
      mode: "static",
      endpoint,
      index: indexName,
      proxy: summarizeProxyEnv(),
      hpi: {
        deployment: hpiStatus.deployment || '(none)',
        source: hpiStatus.source
      }
    });
  }

  // Optional protection for live checks (token header)
  if (LIVE_HEALTH_TOKEN && req.get("x-health-token") !== LIVE_HEALTH_TOKEN) {
    return res.status(403).json({ ok: false, mode: "live", error: "forbidden" });
  }

  const t0 = Date.now();
  try {
    let count = await client.getDocumentsCount();

    // Optional: probe search path with a sample doc id
    let sampleId = null;
    if ((req.query?.probe || "").toString() === "1") {
      const results = await client.search("*", { top: 1, includeTotalCount: true });
      // Prefer totalCount if provided
      if (typeof results.count === "number") {
        count = results.count;
      }
      // Pull first document id if available using a safe iterator approach
      try {
        const resAny = /** @type {any} */ (results);
        if (resAny && typeof resAny[Symbol.asyncIterator] === "function") {
          const iterator = resAny[Symbol.asyncIterator]();
          const first = await iterator.next();
          if (!first.done) {
            const item = first.value;
            const doc = item?.document || item;
            sampleId = doc?.id ?? doc?.["id"] ?? null;
          }
        } else if (resAny && typeof resAny.next === "function") {
          const first = await resAny.next();
          const item = first?.value;
          if (item) {
            const doc = item.document || item;
            sampleId = doc?.id ?? doc?.["id"] ?? null;
          }
        }
      } catch {
        // ignore errors and continue with count only
      }
    }

    const ms = Date.now() - t0;
    const hpiStatus = getHpiStatus();
    // metrics
    liveHealthSuccess.inc();
    liveHealthDuration.observe(ms / 1000);
    res.json({ 
      ok: true, 
      mode: "live", 
      endpoint, 
      index: indexName, 
      count, 
      sampleId, 
      ms,
      hpi: {
        deployment: hpiStatus.deployment || '(none)',
        source: hpiStatus.source
      }
    });
  } catch (/** @type {any} */ err) {
    console.error("Health check (live) failed:", err);
    const msg = err && err.message ? err.message : String(err);
    const stack = err && err.stack ? err.stack : undefined;
    const ms = Date.now() - t0;
    // metrics
    liveHealthFailure.inc();
    liveHealthDuration.observe(ms / 1000);
    res.status(503).json({ ok: false, mode: "live", endpoint, index: indexName, ms, error: msg ? msg.slice(0, 200) : "unknown", proxy: summarizeProxyEnv(), stack });
  }
});

// Prometheus metrics endpoint (text/plain)
app.get("/metrics", async (_req, res) => {
  try {
    const text = await metricsText();
    res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    res.send(text);
  } catch (err) {
    res.status(500).type("text/plain").send(`# metrics error\n${/** @type {any} */(err)?.message || err}`);
  }
});

// Register modular search routes
registerSearchRoutes(app, client, { endpoint, indexName, apiKey });

// Register analyze-note route (now uses RAG, no longer needs direct client access)
registerAnalyzeNoteRoutes(app);

// Register paraphrase-hpi route
registerParaphraseHPIRoutes(app);

// Register medical Q&A route (Prompty pattern with RAG)
registerMedicalQARoutes(app);

// ---- Cardiology parse (Azure Blob + GPT summary) ----
// POST /parse  { container: string, blob: string }
app.post("/parse", async (req, res) => {
  try {
    const { container, blob } = req.body || {};
    if (!container || !blob || typeof container !== "string" || typeof blob !== "string") {
      return res.status(400).json({ ok: false, error: "Missing or invalid { container, blob }" });
    }

    // Resolve repo-root absolute path to src/parsers/cardiology/index.js
    const parserPath = path.resolve(__dirname, "../../src/parsers/cardiology/index.js");
    const parserUrl = pathToFileURL(parserPath).href;
    const mod = await import(parserUrl);
    if (!mod?.parseAzureNote) {
      return res.status(500).json({ ok: false, error: "parseAzureNote not available" });
    }

    const result = await mod.parseAzureNote(container, blob);
    const { sections, entities, meta } = result || {};
    return res.json({
      ok: true,
      assessment: sections?.assessment ?? "",
      plan: sections?.plan ?? "",
      entities: entities ?? {},
      meta: meta ?? {},
    });
  } catch (/** @type {any} */ err) {
    console.error("[/parse] Error:", err);
    const msg = err?.message || String(err);
    return res.status(500).json({ ok: false, error: msg });
  }
});

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ---- START SERVER ----
const port = Number(process.env.PORT || 8080);
const host = "0.0.0.0";

process.on("uncaughtException", (err) => {
  console.error("[ai-search] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[ai-search] Unhandled rejection:", reason);
});

const server = app.listen(port, host, () => {
  console.log(`✅ AI Search API running on http://${host}:${port}`);
});
server.on("listening", () => {
  console.log(`[ai-search] listening on ${host}:${port}`);
});
server.on("error", (err) => {
  console.error("[ai-search] Listen error:", err);
  process.exit(1);
});

// ---- Hot reload via SIGHUP (re-read env, rotate keys) ----
process.on("SIGHUP", () => {
  try {
    console.log("[ai-search] SIGHUP received: reloading configuration");
    dotenv.config({ path: envPath });

    // Rotate Azure Search key if changed
    const newKey = process.env.AZURE_SEARCH_QUERY_KEY;
    if (newKey && newKey !== credential.key) {
      console.log("[ai-search] Rotating Azure Search key via AzureKeyCredential.update");
      credential.update(newKey);
    }

    // Recreate client if endpoint or index changed
    const newEndpoint = process.env.AZURE_SEARCH_ENDPOINT || endpoint;
    const newIndex = process.env.AZURE_SEARCH_INDEX || indexName;
    if (newEndpoint !== client.endpoint || newIndex !== client.indexName) {
      console.log("[ai-search] Recreating SearchClient due to endpoint/index change");
      client = new SearchClient(newEndpoint, newIndex, credential);
    }

    // Clear analyzer cache so it re-initializes OpenAI client on next use
    clearCache();
  } catch (err) {
    console.error("[ai-search] SIGHUP reload failed:", /** @type {any} */(err)?.message || err);
  }
});
