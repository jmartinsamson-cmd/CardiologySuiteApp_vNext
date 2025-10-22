/* eslint-env node */
/* global console, process, fetch */

/**
 * Test script for Medical Q&A with RAG (Prompty pattern)
 * Tests both single and batch question endpoints
 * Node 18+ built-in fetch is used for HTTP tests
 */

import { answerMedicalQuestion } from './services/ai-search/medical-qa.js';

const testQuestions = [
  "Explain the signs and symptoms of an Acute Myocardial Infarction and how to treat.",
  "What are the ACC/AHA guidelines for atrial fibrillation management?",
  "How should I manage a patient with NSTEMI and chronic kidney disease?",
];

async function testSingleQuestion() {
  console.log('='.repeat(80));
  console.log('TEST 1: Single Question (Direct Function Call)');
  console.log('='.repeat(80));
  
  const question = testQuestions[0];
  console.log('\n📝 Question:', question);
  console.log('\n⏳ Retrieving from RAG system...\n');
  
  try {
    const result = await answerMedicalQuestion(question, {
      maxSources: 5,
      temperature: 0.2,
    });
    
    console.log('✅ ANSWER:');
    console.log(result.answer);
    console.log('\n📚 SOURCES:');
    result.sources.forEach((src, idx) => {
      console.log(`  ${idx + 1}. ${src.title}`);
      console.log(`     Score: ${src.score.toFixed(2)}`);
      if (src.url) console.log(`     URL: ${src.url}`);
    });
    console.log('\n📊 METADATA:');
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Documents retrieved: ${result.retrieval.hitsCount}`);
    console.log(`  Top score: ${result.retrieval.topScore.toFixed(2)}`);
    console.log(`  Avg score: ${result.retrieval.avgScore?.toFixed(2) || 'N/A'}`);
    console.log(`  Latency: ${result.latency}ms`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function testAPIEndpoint() {
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST 2: Single Question (HTTP API)');
  console.log('='.repeat(80));
  
  const baseUrl = process.env.AI_SEARCH_BASE_URL || 'http://localhost:8080';
  const question = testQuestions[1];
  
  console.log('\n📝 Question:', question);
  console.log(`\n🌐 Calling ${baseUrl}/api/medical-qa...\n`);
  
  try {
    const response = await fetch(`${baseUrl}/api/medical-qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        maxSources: 5,
        temperature: 0.2,
      }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.error || 'API returned ok: false');
    }
    
    console.log('✅ ANSWER:');
    console.log(result.answer);
    console.log('\n📚 SOURCES:');
    result.sources.forEach((src, idx) => {
      console.log(`  ${idx + 1}. ${src.title} (score: ${src.score.toFixed(2)})`);
    });
    console.log('\n📊 METADATA:');
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`  Documents: ${result.retrieval.hitsCount}, Top score: ${result.retrieval.topScore.toFixed(2)}`);
    console.log(`  Latency: ${result.latency}ms`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function testBatchEndpoint() {
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST 3: Batch Questions (HTTP API)');
  console.log('='.repeat(80));
  
  const baseUrl = process.env.AI_SEARCH_BASE_URL || 'http://localhost:8080';
  const questions = testQuestions.slice(0, 2); // First 2 questions
  
  console.log('\n📝 Questions:');
  questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
  console.log(`\n🌐 Calling ${baseUrl}/api/medical-qa/batch...\n`);
  
  try {
    const response = await fetch(`${baseUrl}/api/medical-qa/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions,
        maxSources: 3,
        temperature: 0.2,
      }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    const result = await response.json();
    
    if (!result.ok) {
      throw new Error(result.error || 'API returned ok: false');
    }
    
    console.log(`✅ Received ${result.count} answers:\n`);
    result.results.forEach((r, idx) => {
      console.log(`${'─'.repeat(80)}`);
      console.log(`QUESTION ${idx + 1}: ${r.question}`);
      console.log(`\nANSWER (confidence ${(r.confidence * 100).toFixed(1)}%):`);
      console.log(r.answer.slice(0, 300) + (r.answer.length > 300 ? '...' : ''));
      console.log(`\nSources: ${r.sources.length}, Latency: ${r.latency}ms`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('\n🏥 Medical Q&A System Test Suite');
  console.log('Using RAG with indexed cardiology guidelines\n');
  
  try {
    // Test 1: Direct function call
    await testSingleQuestion();
    
    // Test 2: HTTP API single question
    await testAPIEndpoint();
    
    // Test 3: HTTP API batch questions
    await testBatchEndpoint();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n\n' + '='.repeat(80));
    console.error('❌ TESTS FAILED');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  }
}

main();
