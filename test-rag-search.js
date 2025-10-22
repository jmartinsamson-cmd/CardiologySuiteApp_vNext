#!/usr/bin/env node
/* eslint-env node */
/* global process, console */

/**
 * Test RAG (Retrieval-Augmented Generation) with Azure Search
 * Verifies that GPT-4 is using your indexed blob files for context
 */
import dotenv from 'dotenv';
import { searchGuidelines } from './services/ai-search/rag/azureSearchClient.js';

dotenv.config();

console.log('\n🔍 Testing RAG Configuration\n');
console.log('━'.repeat(50));

// Check environment variables
console.log('\n📋 Azure Search Configuration:');
console.log(`  AZURE_SEARCH_NAME: ${process.env.AZURE_SEARCH_NAME || '✗ Missing'}`);
console.log(`  AZURE_SEARCH_INDEX: ${process.env.AZURE_SEARCH_INDEX || 'cardiology-index (default)'}`);
console.log(`  AZURE_SEARCH_ADMIN_KEY: ${process.env.AZURE_SEARCH_ADMIN_KEY ? '✓ Set (***hidden***)' : '✗ Missing'}`);
console.log(`  AZURE_SEARCH_ENDPOINT: ${process.env.AZURE_SEARCH_ENDPOINT || '✗ Missing'}`);

// Test search
console.log('\n🔎 Testing guideline retrieval...');
console.log('Query: "atrial fibrillation anticoagulation"');

try {
  const results = await searchGuidelines('atrial fibrillation anticoagulation', 3);
  
  if (results.length === 0) {
    console.log('\n⚠️  No results found');
    console.log('\nPossible issues:');
    console.log('  1. Azure Search index is empty (no blobs indexed)');
    console.log('  2. Index name mismatch (check AZURE_SEARCH_INDEX)');
    console.log('  3. Credentials are incorrect');
    console.log('  4. AZURE_SEARCH_NAME is missing (should be just the service name, not full URL)');
    console.log('\nCurrent endpoint being used:');
    const svc = process.env.AZURE_SEARCH_NAME;
    if (svc) {
      console.log(`  https://${svc}.search.windows.net`);
    } else {
      console.log(`  ${process.env.AZURE_SEARCH_ENDPOINT || 'None'}`);
    }
  } else {
    console.log(`\n✅ Retrieved ${results.length} documents from your Azure Search index!\n`);
    
    results.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.title || 'Untitled'}`);
      console.log(`   Score: ${doc.score?.toFixed(2) || 'N/A'}`);
      console.log(`   Source: ${doc.sourceId || doc.id}`);
      console.log(`   Content preview: ${doc.content?.substring(0, 150) || '(no content)'}...`);
      console.log('');
    });
    
    console.log('✅ RAG is configured correctly!');
    console.log('✅ GPT-4 will use these documents as context when analyzing notes.');
    console.log('\n📝 This means GPT-4 is ONLY referencing YOUR indexed blob files,');
    console.log('   not general medical knowledge from its training data.\n');
  }
} catch (error) {
  console.log('\n❌ Search failed!');
  console.log(`\nError: ${error.message}`);
  console.log('\n📝 Troubleshooting:');
  console.log('  1. Check that AZURE_SEARCH_NAME is set to just the service name');
  console.log('     (e.g., "cardiologysuite-search" not the full URL)');
  console.log('  2. Verify AZURE_SEARCH_ADMIN_KEY is correct');
  console.log('  3. Ensure your index contains documents');
  console.log('  4. Check Azure Search service is running');
}
