#!/usr/bin/env node
/**
 * Print learned parser patterns and training example stats
 * Usage: npm run print:patterns
 */
import { TRAINING_EXAMPLES, getLearnedPatterns, resetLearnedPatterns } from '../src/parsers/parserTrainingExamples.js';

function previewNote(entry) {
  let text = '';
  if (typeof entry === 'string') text = entry;
  else if (entry && typeof entry === 'object') text = entry.note || '';
  text = (text || '').trim();
  return text.slice(0, 140).replace(/\s+/g, ' ') + (text.length > 140 ? '…' : '');
}

function main() {
  console.log('\n🔎 Training Examples Summary');
  console.log('============================');
  console.log(`Total entries: ${TRAINING_EXAMPLES.length}`);

  const last = TRAINING_EXAMPLES[TRAINING_EXAMPLES.length - 1];
  console.log(`Last entry preview: ${previewNote(last)}`);

  // Learn patterns fresh
  resetLearnedPatterns();
  const patterns = getLearnedPatterns();

  console.log('\n📚 Learned Patterns');
  console.log('===================');
  for (const [cat, info] of Object.entries(patterns)) {
    const aliases = info.aliases || [];
    console.log(`- ${cat}: ${aliases.length} aliases`);
    if (aliases.length) {
      console.log(`  e.g., ${aliases.slice(0, 5).join(' | ')}`);
    }
  }
  console.log('');
}

main();
