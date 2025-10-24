#!/usr/bin/env node
/**
 * Direct Azure Search API Test
 */
import 'dotenv/config';

const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
const apiKey = process.env.AZURE_SEARCH_API_KEY;
const index = process.env.AZURE_SEARCH_INDEX;

console.log('🔍 Direct Azure Search API Test\n');
console.log('Endpoint:', endpoint);
console.log('Index:', index);
console.log('API Key:', apiKey ? '✓ Set (***hidden***)' : '✗ Missing');

if (!endpoint || !apiKey || !index) {
  console.log('\n❌ Missing configuration in .env file');
  process.exit(1);
}

const url = `${endpoint}/indexes/${index}/docs/search?api-version=2024-07-01`;
console.log('\n📡 Testing:', url);

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      search: 'atrial fibrillation anticoagulation',
      top: 3,
      select: 'id,title,content'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`\n❌ HTTP ${response.status}: ${response.statusText}`);
    console.log('Error details:', error);
    process.exit(1);
  }

  const data = await response.json();
  
  if (data.value && data.value.length > 0) {
    console.log(`\n✅ Azure AI Search is working!`);
    console.log(`Found ${data.value.length} documents:\n`);
    
    data.value.forEach((doc, i) => {
      console.log(`${i+1}. ${doc.title || doc.id}`);
      if (doc.content) {
        console.log(`   Preview: ${doc.content.substring(0, 100)}...`);
      }
      console.log('');
    });
  } else {
    console.log('\n⚠️  Index exists but returned no documents');
    console.log('This could mean:');
    console.log('  - The index is empty (no documents uploaded)');
    console.log('  - Query did not match any documents');
    console.log('  - Documents lack searchable fields');
  }
} catch (error) {
  console.log('\n❌ Request failed:', error.message);
  console.log('\nPossible issues:');
  console.log('  - Invalid endpoint URL');
  console.log('  - Incorrect API key');
  console.log('  - Network connectivity problems');
  console.log('  - Service not accessible');
}
