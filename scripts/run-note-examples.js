#!/usr/bin/env node
// Run local note examples against the AI analyzer endpoint
// Usage: node scripts/run-note-examples.js [file1 ...]

import fs from 'node:fs/promises';

const AI_URL = process.env.AI_URL || 'http://localhost:8081';

/**
 * @param {string} file
 */
async function loadNoteContent(file) {
  const raw = await fs.readFile(file, 'utf8');
  if (file.endsWith('.json')) {
    try {
      const obj = JSON.parse(raw);
      // Prefer .input, else .note, else stringify
      return obj.input || obj.note || raw;
    } catch {
      return raw;
    }
  }
  return raw; // .txt or other
}

/**
 * @param {string} note
 */
async function analyze(note) {
  const res = await fetch(`${AI_URL}/api/analyze-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}` };
  }
  return res.json();
}

async function waitForServer() {
  console.log('Waiting for AI server to be ready...');
  for (let i = 0; i < 15; i++) { // Increased retries to 15
    try {
      const res = await fetch(`${AI_URL}/health`);
      if (res.ok) {
        console.log('AI server is ready.');
        return true;
      }
    } catch (e) {
      // Ignore connection errors on first few attempts, then log
      if (i > 2 && e instanceof Error) {
        console.log(`Server not ready yet (attempt ${i + 1}/15): ${e.message}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  }
  console.error('AI server did not become ready in time.');
  return false;
}

/**
 * @param {string} file
 */
async function processFile(file) {
  try {
    const note = await loadNoteContent(file);
    const result = await analyze(note);
    const firstAssessment = Array.isArray(result.assessment) && result.assessment.length > 0 ? result.assessment[0] : '-';
    console.log(`[${file}] ok=${result.ok === true} assessment=${firstAssessment}`);
    if (result.ok !== true) {
      console.error(`[${file}] Full error response:`, JSON.stringify(result, null, 2));
    }
  } catch (err) {
    const msg = (err && typeof err === 'object' && 'message' in err) ? err.message : String(err);
    console.log(`[${file}] ok=false error=${msg}`);
    if (err instanceof Error && 'cause' in err) {
      console.error('Fetch error cause:', err.cause);
    }
    if (err instanceof Error) {
      console.error(err.stack);
    }
  }
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: node scripts/run-note-examples.js <file1> [file2 ...]');
    process.exit(1);
  }

  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  for (const file of files) {
    await processFile(file);
  }
}

(async () => {
  await main();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
