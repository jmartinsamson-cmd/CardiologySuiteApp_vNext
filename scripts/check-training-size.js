#!/usr/bin/env node
/**
 * Check the size of parser training examples file
 * Usage: node scripts/check-training-size.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const trainingFile = join(__dirname, '../src/parsers/parserTrainingExamples.js');

try {
  const content = readFileSync(trainingFile, 'utf8');
  const sizeBytes = Buffer.byteLength(content, 'utf8');
  const sizeKB = (sizeBytes / 1024).toFixed(2);
  
  // Count examples (rough estimate by counting backticks)
  const backtickCount = (content.match(/`/g) || []).length;
  const estimatedExamples = Math.floor(backtickCount / 2);
  
  console.log('\n📊 Parser Training File Stats:');
  console.log('================================');
  console.log(`File: ${trainingFile.replace(process.cwd(), '.')}`);
  console.log(`Size: ${sizeKB} KB (${sizeBytes.toLocaleString()} bytes)`);
  console.log(`Estimated examples: ~${estimatedExamples}`);
  console.log(`Lines: ${content.split('\n').length.toLocaleString()}`);
  
  // Warnings
  if (sizeBytes > 200000) { // > 200 KB
    console.log('\n🚨 WARNING: File is very large!');
    console.log('   This may slow down page loading.');
    console.log('   Consider removing old examples.\n');
    process.exit(1);
  } else if (sizeBytes > 100000) { // > 100 KB
    console.log('\n⚠️  NOTICE: File is getting large.');
    console.log('   Consider focusing on diverse examples.');
    console.log('   5-10 diverse formats is usually enough.\n');
  } else {
    console.log('\n✅ File size is good!\n');
  }
  
} catch (error) {
  console.error('Error reading training file:', error.message);
  process.exit(1);
}
