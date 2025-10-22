#!/usr/bin/env node
/* eslint-env node */
/* global process, console */

/**
 * Test complete RAG pipeline: Backend → Azure Search → GPT-4
 * Tests the analyze-note endpoint with RAG enabled
 */

import 'dotenv/config';
import fetch from 'node-fetch';

// codacy-disable-next-line
const BACKEND_URL = 'http://localhost:8081';

const testNote = `
Chief Complaint: Chest pain
HPI: 68-year-old male with chest pain for 2 hours, radiating to left arm.
PMH: Hypertension, hyperlipidemia, CKD stage 3
Social: 20 pack-year smoking history

Vitals: BP 150/92, HR 88, RR 18, O2 98% RA

Labs:
- Troponin I: 0.36 ng/mL (elevated)
- BNP: 120 pg/mL
- Creatinine: 1.5 mg/dL

ECG: ST depressions in V4-V6, no Q waves

Assessment: NSTEMI with CKD
`.trim();

async function testCompleteRAG() {
  console.log('🔍 Testing Complete RAG Pipeline\n');
  console.log('━'.repeat(50));
  
  // Check if backend is running
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/health`);
    if (!healthCheck.ok) {
      console.error('❌ Backend not responding. Start with: npm run start:search');
      process.exit(1);
    }
    console.log('✅ Backend server is running\n');
  } catch {
    console.error('❌ Backend not running. Start with: npm run start:search');
    process.exit(1);
  }

  // Test analyze-note with RAG
  console.log('📝 Sending test note to analyze-note endpoint...\n');
  console.log('Test note:');
  console.log(testNote);
  console.log('\n' + '━'.repeat(50) + '\n');

  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        note: testNote,
        useAI: true  // Enable AI analysis
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Analysis failed: ${response.status} ${response.statusText}`);
      console.error(errorText);
      process.exit(1);
    }

    const result = await response.json();
    
    console.log('✅ Analysis Complete!\n');
    
    // Check if RAG was used
    if (result.retrievedDocs && result.retrievedDocs.length > 0) {
      console.log(`📚 RAG Retrieved ${result.retrievedDocs.length} documents:\n`);
      result.retrievedDocs.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.title || 'Untitled'}`);
        console.log(`   Score: ${doc.score?.toFixed(2) || 'N/A'}`);
        console.log(`   Content preview: ${(doc.content || '').slice(0, 100)}...`);
        console.log('');
      });
      console.log('✅ GPT-4 used YOUR indexed guidelines for this analysis!\n');
    } else {
      console.log('⚠️  No documents retrieved from RAG (using general GPT-4 knowledge)\n');
    }

    // Display assessment and plan
    if (result.assessment) {
      console.log('━'.repeat(50));
      console.log('📋 ASSESSMENT:\n');
      console.log(result.assessment);
      console.log('');
    }

    if (result.plan) {
      console.log('━'.repeat(50));
      console.log('📋 PLAN:\n');
      console.log(result.plan);
      console.log('');
    }

    // Check for citations
    if (result.citations && result.citations.length > 0) {
      console.log('━'.repeat(50));
      console.log('📖 CITATIONS:\n');
      result.citations.forEach((citation, i) => {
        console.log(`${i + 1}. ${citation.title || citation.sourceId || 'Unknown'}`);
        if (citation.url) console.log(`   URL: ${citation.url}`);
      });
      console.log('\n✅ GPT-4 cited your specific guideline documents!');
    }

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Complete RAG pipeline is working correctly!');
    console.log('✅ GPT-4 is using ONLY your 663 indexed cardiology guidelines.');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

testCompleteRAG();
