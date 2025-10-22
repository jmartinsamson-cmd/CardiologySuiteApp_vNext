#!/usr/bin/env node
/**
 * Import real test fixtures into TRAINING_EXAMPLES as plain string notes.
 * It scans tests/fixtures/real/*.json and appends the `input` field
 * to src/parsers/parserTrainingExamples.js as template string entries.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const realDir = join(process.cwd(), 'tests', 'fixtures', 'real');
const trainingFile = join(process.cwd(), 'src', 'parsers', 'parserTrainingExamples.js');

function listJsonFiles(dir) {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.json'));
  } catch (e) {
    console.error('Could not read directory', dir, e.message);
    process.exit(1);
  }
}

function loadNotes(files) {
  const notes = [];
  for (const f of files) {
    const full = join(realDir, f);
    try {
      const json = JSON.parse(readFileSync(full, 'utf8'));
      const input = (json && json.input) || '';
      if (typeof input === 'string' && input.trim().length > 300) {
        notes.push({ file: f, text: input });
      }
    } catch (e) {
      console.warn('Skip invalid JSON:', f, e.message);
    }
  }
  return notes;
}

function escapeBackticks(s) {
  return s.replace(/`/g, '\\`');
}

function insertNotesIntoTraining(filePath, notes) {
  const src = readFileSync(filePath, 'utf8');
  const marker = ']';
  const endIdx = src.lastIndexOf('];');
  if (endIdx === -1) {
    console.error('Could not find TRAINING_EXAMPLES array end ( "];"). Aborting.');
    process.exit(1);
  }

  const head = src.slice(0, endIdx);
  const tail = src.slice(endIdx);

  const blocks = notes.map(n => `
  /* Imported from tests/fixtures/real/${n.file} */
  \`
${escapeBackticks(n.text).trim()}
  \`,
`).join('\n');

  const updated = head + blocks + '\n' + tail;
  writeFileSync(filePath, updated, 'utf8');
}

function main() {
  const files = listJsonFiles(realDir);
  const notes = loadNotes(files);
  if (notes.length === 0) {
    console.log('No eligible notes found in', realDir);
    return;
  }
  // Pick up to 4 diverse notes to avoid bloat
  const selected = notes.slice(0, 4);
  console.log(`Found ${notes.length} notes, importing ${selected.length}:`);
  for (const n of selected) {
    console.log(` - ${n.file} (${n.text.length} chars)`);
  }
  insertNotesIntoTraining(trainingFile, selected);
  console.log('\n✅ Imported into', trainingFile);
}

main();
