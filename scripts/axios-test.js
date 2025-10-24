import fs from 'node:fs/promises';
import axios from 'axios';

const AI_URL = 'http://localhost:8081';
const NOTE_FILE = 'tests/fixtures/user-provided-note.txt';

async function runTest() {
  console.log(`[+] Reading note from: ${NOTE_FILE}`);
  const note = await fs.readFile(NOTE_FILE, 'utf8');

  console.log(`[+] Sending note to AI service at: ${AI_URL}/api/analyze-note`);

  try {
    const response = await axios.post(`${AI_URL}/api/analyze-note`, {
      note: note,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000, // 30-second timeout
    });

    console.log(`[+] Received response with status: ${response.status}`);
    
    console.log('[+] Analysis complete. Result:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('[!] An error occurred during the axios request:');
    if (axios.isAxiosError(error)) {
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }
    } else {
      console.error(error);
    }
  }
}

runTest();
