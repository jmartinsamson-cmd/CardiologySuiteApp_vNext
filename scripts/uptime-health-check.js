#!/usr/bin/env node

/**
 * Uptime Health Check Script
 * Performs 20 health check requests with jitter and calculates metrics
 */

import { createRequire } from 'node:module';
import { writeFileSync, appendFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';

const require = createRequire(import.meta.url);
const https = require('node:https');
const http = require('node:http');

const PROD_API_BASE_URL = process.env.PROD_API_BASE_URL;
const HEALTH_ENDPOINT = '/api/health';
const TOTAL_REQUESTS = 20;
const P95_THRESHOLD_MS = 300;
const MAX_JITTER_MS = 1000; // 1 second max jitter between requests

if (!PROD_API_BASE_URL) {
  console.error('❌ PROD_API_BASE_URL environment variable is required');
  process.exit(1);
}

const HEALTH_URL = PROD_API_BASE_URL + HEALTH_ENDPOINT;

/**
 * Sleep for a random amount of time (jitter)
 */
function sleepWithJitter() {
  const jitter = Math.random() * MAX_JITTER_MS;
  return setTimeout(jitter);
}

/**
 * Make a single HTTP request and measure latency
 */
function makeRequest(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https://') ? https : http;

    const req = protocol.get(url, (res) => {
      const latency = Date.now() - startTime;
      const statusCode = res.statusCode;

      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          status: statusCode,
          latency,
          url,
          success: statusCode === 200,
          body: body.length > 100 ? body.substring(0, 100) + '...' : body
        });
      });
    });

    req.on('error', (error) => {
      const latency = Date.now() - startTime;
      resolve({
        status: null,
        latency,
        url,
        success: false,
        error: error.message
      });
    });

    // Set timeout
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        status: null,
        latency: Date.now() - startTime,
        url,
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

/**
 * Calculate P95 latency from an array of latencies
 */
function calculateP95(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[index];
}

/**
 * Calculate average latency
 */
function calculateAverage(latencies) {
  return latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  console.log(`🏥 Starting uptime health check for ${HEALTH_URL}`);
  console.log(`📊 Will perform ${TOTAL_REQUESTS} requests with jitter`);

  const results = [];
  const latencies = [];

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    console.log(`🔄 Request ${i + 1}/${TOTAL_REQUESTS}...`);

    const result = await makeRequest(HEALTH_URL);
    results.push(result);

    if (result.success) {
      latencies.push(result.latency);
      console.log(`✅ ${result.status} - ${result.latency}ms`);
    } else {
      console.log(`❌ ${result.status || 'ERROR'} - ${result.latency}ms - ${result.error || 'Unknown error'}`);
    }

    // Add jitter between requests (except for the last one)
    if (i < TOTAL_REQUESTS - 1) {
      await sleepWithJitter();
    }
  }

  // Calculate metrics
  const successfulRequests = results.filter(r => r.success).length;
  const failedRequests = results.filter(r => !r.success);
  const errorRate = ((failedRequests.length / TOTAL_REQUESTS) * 100).toFixed(2);
  const p95Latency = latencies.length > 0 ? calculateP95(latencies) : 0;
  const averageLatency = latencies.length > 0 ? calculateAverage(latencies) : 0;

  const metrics = {
    timestamp: new Date().toISOString(),
    url: HEALTH_URL,
    totalRequests: TOTAL_REQUESTS,
    successfulRequests,
    failedRequests: failedRequests.map(r => ({
      status: r.status,
      latency: r.latency,
      error: r.error
    })),
    errorRate: Number.parseFloat(errorRate),
    p95Latency: Math.round(p95Latency),
    averageLatency: Math.round(averageLatency),
    allResults: results
  };

  // Write metrics to file
  writeFileSync('uptime-metrics.json', JSON.stringify(metrics, null, 2));
  console.log('📄 Metrics written to uptime-metrics.json');

  // Determine if check failed
  const hasNon200 = failedRequests.length > 0;
  const p95TooHigh = p95Latency > P95_THRESHOLD_MS;

  if (hasNon200 || p95TooHigh) {
    console.log('❌ Health check FAILED');

    if (hasNon200) {
      console.log(`   - ${failedRequests.length} non-200 responses`);
    }

    if (p95TooHigh) {
      console.log(`   - P95 latency ${p95Latency.toFixed(2)}ms > ${P95_THRESHOLD_MS}ms threshold`);
    }

    // Set GitHub Actions output
    appendFileSync(process.env.GITHUB_OUTPUT || '/dev/stdout', 'status=failure\n');

    process.exit(1);
  } else {
    console.log('✅ Health check PASSED');
    console.log(`   - All ${TOTAL_REQUESTS} requests successful`);
    console.log(`   - P95 latency: ${p95Latency.toFixed(2)}ms`);
    console.log(`   - Average latency: ${averageLatency.toFixed(2)}ms`);

    // Set GitHub Actions output
    appendFileSync(process.env.GITHUB_OUTPUT || '/dev/stdout', 'status=success\n');

    process.exit(0);
  }
}

// Run the health check
 
runHealthCheck().catch((error) => {
  console.error('💥 Health check script failed:', error);
  appendFileSync(process.env.GITHUB_OUTPUT || '/dev/stdout', 'status=failure\n');
  process.exit(1);
});