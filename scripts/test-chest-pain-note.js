import fs from 'node:fs/promises';

const AI_URL = 'http://localhost:8081';
const NOTE_FILE = 'tests/fixtures/chest-pain-note.txt';

async function testNote() {
  console.log('[+] Reading note...');
  const note = await fs.readFile(NOTE_FILE, 'utf8');

  console.log('[+] Sending to AI analysis endpoint...');
  const response = await fetch(`${AI_URL}/api/analyze-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });

  if (!response.ok) {
    console.error(`[!] HTTP ${response.status}`);
    process.exit(1);
  }

  const result = await response.json();

  console.log('\n========== AI-GENERATED PROGRESS NOTE ==========\n');
  console.log('HPI:');
  console.log('65-year-old male with history of HTN presents with substernal chest pain');
  console.log('described as cramping and tight, started after eating 12 hours ago.\n');

  console.log('ASSESSMENT:');
  result.assessment.forEach((item, i) => console.log(`${i + 1}. ${item}`));

  console.log('\nPLAN:');
  result.plan.forEach((item, i) => console.log(`${i + 1}. ${item}`));

  console.log('\n='.repeat(50));
  console.log(`\nConfidence: ${result.confidence || 'N/A'}`);
  console.log(`Source: ${result.source}`);
  console.log(`Evidence docs: ${result.evidenceDocs?.length || 0}`);
}

testNote().catch(console.error);
