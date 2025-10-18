/* eslint-env node */
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

// Dedicated registry so we control what we expose
export const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: "ai_search_" });

// Live health metrics
export const liveHealthSuccess = new Counter({
  name: "ai_search_live_health_success_total",
  help: "Total successful live health checks",
  registers: [registry],
});

export const liveHealthFailure = new Counter({
  name: "ai_search_live_health_failure_total",
  help: "Total failed live health checks",
  registers: [registry],
});

export const liveHealthDuration = new Histogram({
  name: "ai_search_live_health_duration_seconds",
  help: "Duration of live health checks in seconds",
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [registry],
});

export async function metricsText() {
  return registry.metrics();
}
