import fs from 'node:fs/promises';

const AI_URL = 'http://localhost:8081';
const NOTE_FILE = 'tests/fixtures/user-provided-note.txt';

async function runTest() {
  console.log(`[+] Reading note from: ${NOTE_FILE}`);
  const note = await fs.readFile(NOTE_FILE, 'utf8');

  console.log(`[+] Sending note to AI service at: ${AI_URL}/api/analyze-note`);

  const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
    const response = await fetch(`${AI_URL}/api/analyze-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`[+] Received response with status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[!] HTTP Error: ${response.status}`);
      console.error(`[!] Error Body: ${errorBody}`);
      return;
    }

    const result = await response.json();
    console.log('[+] Analysis complete. Result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('[!] An error occurred during the fetch operation:');
    console.error(error);
    if (error instanceof Error && 'cause' in error) {
        console.error('[!] Cause:', error.cause);
    }
  }
}

runTest();
