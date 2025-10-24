#!/usr/bin/env node

/**
 * API Smoke Test Harness
 * Tests all API endpoints with schema validation and jittered concurrency
 * Outputs JUnit XML for CI integration
 *
 * Usage: node scripts/api-smoke-test.js [baseUrl] [--junit output.xml] [--concurrency N] [--iterations N]
 */

import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
dirname(__filename); // Keep for potential future use

// Test configuration
const DEFAULT_BASE_URL = 'http://localhost:7071'; // Azure Functions local
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_ITERATIONS = 5;

// Schema definitions for response validation
const SCHEMAS = {
  health: {
    type: 'object',
    required: ['ok', 'runtime', 'node', 'env'],
    properties: {
      ok: { type: 'boolean' },
      runtime: { type: 'string' },
      node: { type: 'string' },
      env: {
        type: 'object',
        properties: {
          hasAppInsightsKey: { type: 'boolean' },
          hasStorageConn: { type: 'boolean' },
          hasStorageAccount: { type: 'boolean' },
          hasStorageKey: { type: 'boolean' }
        }
      }
    }
  },
  ping: {
    type: 'object',
    required: ['pong', 'ts'],
    properties: {
      pong: { type: 'boolean' },
      ts: { type: 'string' }
    }
  },
  sessions_save: {
    type: 'object',
    required: ['success', 'sessionId', 'message'],
    properties: {
      success: { type: 'boolean' },
      sessionId: { type: 'string' },
      message: { type: 'string' }
    }
  },
  analytics_track: {
    type: 'object',
    required: ['success', 'eventId'],
    properties: {
      success: { type: 'boolean' },
      eventId: { type: 'string' }
    }
  },
  preferences_get: {
    type: 'object',
    required: ['userId', 'preferences'],
    properties: {
      userId: { type: 'string' },
      preferences: { type: 'object' }
    }
  },
  preferences_post: {
    type: 'object',
    required: ['success', 'preferences'],
    properties: {
      success: { type: 'boolean' },
      preferences: { type: 'object' }
    }
  }
};

// Test cases
const TEST_CASES = [
  {
    name: 'health_endpoint',
    method: 'GET',
    path: '/api/health',
    schema: 'health',
    expectedStatus: 200
  },
  {
    name: 'ping_endpoint',
    method: 'GET',
    path: '/api/ping',
    schema: 'ping',
    expectedStatus: 200
  },
  {
    name: 'sessions_save_valid',
    method: 'POST',
    path: '/api/sessions/save',
    body: {
      userId: 'test-user-' + Date.now(),
      sessionData: { feature: 'note-tools', timestamp: new Date().toISOString() }
    },
    schema: 'sessions_save',
    expectedStatus: 200
  },
  {
    name: 'sessions_save_invalid',
    method: 'POST',
    path: '/api/sessions/save',
    body: { invalid: 'data' },
    expectedStatus: 400
  },
  {
    name: 'analytics_track_valid',
    method: 'POST',
    path: '/api/analytics/track',
    body: {
      eventType: 'page_view',
      metadata: { page: 'home', timestamp: new Date().toISOString() }
    },
    schema: 'analytics_track',
    expectedStatus: 200
  },
  {
    name: 'analytics_track_invalid',
    method: 'POST',
    path: '/api/analytics/track',
    body: { invalid: 'data' },
    expectedStatus: 400
  },
  {
    name: 'preferences_get_valid',
    method: 'GET',
    path: '/api/preferences?userId=test-user-' + Date.now(),
    schema: 'preferences_get',
    expectedStatus: 200
  },
  {
    name: 'preferences_post_valid',
    method: 'POST',
    path: '/api/preferences',
    body: {
      userId: 'test-user-' + Date.now(),
      preferences: { theme: 'dark', notifications: true }
    },
    schema: 'preferences_post',
    expectedStatus: 200
  }
];

// Simple schema validator (basic JSON schema subset)
function validateSchema(data, schemaName) {
  const schema = SCHEMAS[schemaName];
  if (!schema) return { valid: true }; // No schema defined

  const errors = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check types
  if (schema.properties) {
    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (field in data) {
        const value = data[field];
        if (fieldSchema.type && typeof value !== fieldSchema.type) {
          errors.push(`Field ${field} should be ${fieldSchema.type}, got ${typeof value}`);
        }
        // Nested object validation (basic)
        if (fieldSchema.type === 'object' && fieldSchema.properties && typeof value === 'object') {
          const nestedErrors = validateSchema(value, fieldSchema).errors || [];
          errors.push(...nestedErrors.map(e => `${field}.${e}`));
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Make HTTP request
async function makeRequest(baseUrl, testCase) {
  const url = baseUrl + testCase.path;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: testCase.body ? JSON.stringify(testCase.body) : undefined
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { raw: responseText };
    }

    // Validate status
    const statusValid = response.status === testCase.expectedStatus;

    // Validate schema if response is JSON
    let schemaValid = true;
    let schemaErrors = [];
    if (testCase.schema && responseData && typeof responseData === 'object') {
      const validation = validateSchema(responseData, testCase.schema);
      schemaValid = validation.valid;
      schemaErrors = validation.errors;
    }

    return {
      success: statusValid && schemaValid,
      status: response.status,
      expectedStatus: testCase.expectedStatus,
      responseTime,
      schemaValid,
      schemaErrors,
      error: null
    };

  } catch (err) {
    return {
      success: false,
      status: null,
      expectedStatus: testCase.expectedStatus,
      responseTime: Date.now() - startTime,
      schemaValid: true,
      schemaErrors: [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// Jittered delay for concurrency simulation
function jitteredDelay(minMs = 100, maxMs = 1000) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Run test iteration
async function runIteration(baseUrl, testCases, iteration) {
  const results = [];

  for (const testCase of testCases) {
    await jitteredDelay(); // Add jitter between requests

    console.log(`[${iteration}] Testing ${testCase.name}...`);
    const result = await makeRequest(baseUrl, testCase);
    results.push({
      testCase,
      result,
      iteration
    });

    const status = result.success ? 'PASS' : 'FAIL';
    console.log(`[${iteration}] ${status} ${testCase.name} (${result.responseTime}ms)`);
    if (!result.success) {
      console.log(`  Expected status: ${result.expectedStatus}, got: ${result.status}`);
      if (result.error) console.log(`  Error: ${result.error}`);
      if (result.schemaErrors.length > 0) {
        console.log(`  Schema errors: ${result.schemaErrors.join(', ')}`);
      }
    }
  }

  return results;
}

// Generate JUnit XML
function generateJUnitXML(results, totalTime) {
  const testSuites = {};

  // Group by test case
  for (const { testCase, result, iteration } of results) {
    if (!testSuites[testCase.name]) {
      testSuites[testCase.name] = {
        tests: 0,
        failures: 0,
        time: 0,
        testCases: []
      };
    }

    testSuites[testCase.name].tests++;
    testSuites[testCase.name].time += result.responseTime / 1000; // Convert to seconds

    if (!result.success) {
      testSuites[testCase.name].failures++;
    }

    testSuites[testCase.name].testCases.push({
      name: `${testCase.name}_iteration_${iteration}`,
      time: result.responseTime / 1000,
      failure: result.success ? null : {
        message: `Expected status ${result.expectedStatus}, got ${result.status}`,
        details: [
          result.error && `Error: ${result.error}`,
          result.schemaErrors.length > 0 && `Schema: ${result.schemaErrors.join(', ')}`
        ].filter(Boolean).join('\n')
      }
    });
  }

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<testsuites>\n';

  for (const [suiteName, suite] of Object.entries(testSuites)) {
    xml += `  <testsuite name="${suiteName}" tests="${suite.tests}" failures="${suite.failures}" time="${suite.time.toFixed(3)}">\n`;

    for (const testCase of suite.testCases) {
      xml += `    <testcase name="${testCase.name}" time="${testCase.time.toFixed(3)}">\n`;
      if (testCase.failure) {
        xml += `      <failure message="${testCase.failure.message}">\n`;
        xml += `        <![CDATA[${testCase.failure.details}]]>\n`;
        xml += '      </failure>\n';
      }
      xml += '    </testcase>\n';
    }

    xml += '  </testsuite>\n';
  }

  xml += '</testsuites>\n';
  return xml;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments first
  let baseUrl = null;
  let junitOutput = null;
  let concurrency = DEFAULT_CONCURRENCY;
  let iterations = DEFAULT_ITERATIONS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--junit' && args[i + 1]) {
      junitOutput = args[i + 1];
      i++;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      concurrency = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--iterations' && args[i + 1]) {
      iterations = parseInt(args[i + 1]);
      i++;
    } else if (!args[i].startsWith('--') && !baseUrl) {
      // First non-flag argument is the base URL
      baseUrl = args[i];
    }
  }

  // Use provided baseUrl, or fall back to env var, or default
  baseUrl = baseUrl || process.env.API_BASE_URL || DEFAULT_BASE_URL;

  console.log(`🚀 Starting API smoke tests`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Concurrency: ${concurrency}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`JUnit output: ${junitOutput || 'none'}`);
  console.log('');

  const startTime = Date.now();
  const allResults = [];

  // Run iterations with concurrency
  for (let iter = 1; iter <= iterations; iter++) {
    console.log(`\n📊 Iteration ${iter}/${iterations}`);

    // Split test cases for concurrency
    const chunkSize = Math.ceil(TEST_CASES.length / concurrency);
    const chunks = [];
    for (let i = 0; i < TEST_CASES.length; i += chunkSize) {
      chunks.push(TEST_CASES.slice(i, i + chunkSize));
    }

    // Run chunks concurrently
    const iterationPromises = chunks.map(chunk => runIteration(baseUrl, chunk, iter));
    const iterationResults = await Promise.all(iterationPromises);
    allResults.push(...iterationResults.flat());
  }

  const totalTime = Date.now() - startTime;

  // Analyze results
  const totalTests = allResults.length;
  const passedTests = allResults.filter(r => r.result.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n📈 Results Summary`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`);

  // Generate JUnit XML if requested
  if (junitOutput) {
    const junitXml = generateJUnitXML(allResults, totalTime);
    writeFileSync(junitOutput, junitXml);
    console.log(`JUnit XML written to: ${junitOutput}`);
  }

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Test harness failed:', error);
    process.exit(1);
  });
}

export { makeRequest, validateSchema, generateJUnitXML };