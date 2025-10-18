/* eslint-env node */
/* global process */

import { useAzureMonitor } from "@azure/monitor-opentelemetry";
import { logs } from "@opentelemetry/api-logs";
import { metrics } from "@opentelemetry/api";

/**
 * Initialize Azure Monitor OpenTelemetry exporter if configured.
 * Reads either APPLICATIONINSIGHTS_CONNECTION_STRING or APPINSIGHTS_INSTRUMENTATIONKEY.
 */
export function initTelemetry() {
  const conn = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  const ikey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;

  if (!conn && !ikey) {
    if (process.env.DEBUG_TELEMETRY === "true") {
      console.log("[telemetry] App Insights not configured (set APPINSIGHTS_INSTRUMENTATIONKEY or APPLICATIONINSIGHTS_CONNECTION_STRING)");
    }
    return;
  }

  const connectionString = conn || `InstrumentationKey=${ikey}`;
  try {
    useAzureMonitor({
      azureMonitorExporterOptions: { connectionString },
    });
    if (process.env.DEBUG_TELEMETRY === "true") {
      console.log("[telemetry] Azure Monitor OpenTelemetry initialized");
    }
  } catch (err) {
    console.error("[telemetry] Initialization failed:", /** @type {any} */ (err)?.message || err);
  }

  // Initialize custom metrics
  try {
    meter = metrics.getMeter("ai-search", "1.0.0");
    cacheHitCounter = meter.createCounter("ai.cache.hits", {
      description: "Count of analysis cache hits",
    });
    analysisLatencyHistogram = meter.createHistogram("ai.analysis.latency", {
      description: "Latency of AI analysis in milliseconds",
      unit: "ms",
    });
    restFallbackCounter = meter.createCounter("ai.search.rest.fallbacks", {
      description: "Count of times REST search fallback was used",
    });
  } catch (err) {
    if (process.env.DEBUG_TELEMETRY === "true") {
      console.log("[telemetry] metrics init failed:", /** @type {any} */ (err)?.message || err);
    }
  }
}

/**
 * Emit a telemetry log with custom dimensions (goes to App Insights 'traces').
 * @param {string} message
 * @param {Record<string, any>} properties
 */
export function logAIEvent(message, properties = {}) {
  if (process.env.DEBUG_TELEMETRY === "true") {
    const safe = { ...properties };
    console.log("[TELEMETRY]", message, JSON.stringify(safe));
  }

  // If Azure Monitor is not configured, this will no-op silently.
  try {
    const logger = logs.getLogger("ai-search", "1.0.0");
    // Emit a simple log record with attributes (mapped to customDimensions)
    logger.emit({
      body: message,
      attributes: properties,
    });
  } catch (err) {
    if (process.env.DEBUG_TELEMETRY === "true") {
      console.log("[telemetry] emit failed:", /** @type {any} */ (err)?.message || err);
    }
  }
}

// ---- Custom Metrics ----
/** @type {import("@opentelemetry/api").Meter | undefined} */
let meter;
/** @type {import("@opentelemetry/api").Counter | undefined} */
let cacheHitCounter;
/** @type {import("@opentelemetry/api").Histogram | undefined} */
let analysisLatencyHistogram;
/** @type {import("@opentelemetry/api").Counter | undefined} */
let restFallbackCounter;

/**
 * Record a cache hit metric for the analyzer cache.
 * @param {boolean} hit
 */
export function recordCacheHit(hit) {
  if (!hit || !cacheHitCounter) return;
  try {
    cacheHitCounter.add(1);
  } catch (err) {
    const msg = /** @type {any} */ (err)?.message || err;
    if (process.env.DEBUG_TELEMETRY === "true") console.log("[telemetry] recordCacheHit failed", msg);
  }
}

/**
 * Record analysis latency in milliseconds with optional attributes.
 * @param {number} ms
 * @param {Record<string, string | number | boolean>} [attributes]
 */
export function recordAnalysisLatency(ms, attributes = {}) {
  if (!analysisLatencyHistogram || typeof ms !== "number" || !Number.isFinite(ms)) return;
  try {
    analysisLatencyHistogram.record(ms, attributes);
  } catch (err) {
    const msg = /** @type {any} */ (err)?.message || err;
    if (process.env.DEBUG_TELEMETRY === "true") console.log("[telemetry] recordAnalysisLatency failed", msg);
  }
}

/**
 * Record that REST fallback was used for search.
 */
export function recordRestFallback() {
  if (!restFallbackCounter) return;
  try {
    restFallbackCounter.add(1);
  } catch (err) {
    const msg = /** @type {any} */ (err)?.message || err;
    if (process.env.DEBUG_TELEMETRY === "true") console.log("[telemetry] recordRestFallback failed", msg);
  }
}
