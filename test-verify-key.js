#!/usr/bin/env node
import 'dotenv/config';

const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
const adminKey = process.env.AZURE_SEARCH_ADMIN_KEY;

console.log('\n🔍 Verifying Azure Search Service\n');
console.log('Endpoint:', endpoint);
console.log('Admin Key:', adminKey ? `${adminKey.substring(0, 10)}...` : 'Missing');

// Test 1: List indexes
console.log('\n📋 Test 1: List Indexes\n');

try {
  const response = await fetch(`${endpoint}/indexes?api-version=2024-07-01`, {
    headers: { 'api-key': adminKey }
  });

  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Admin key is VALID for ${endpoint}`);
    console.log(`\nFound ${data.value.length} indexes:\n`);
    data.value.forEach(idx => {
      console.log(`  - ${idx.name}`);
    });
    
    // Test 2: Search a specific index
    const indexName = data.value[0]?.name || 'edu-index-v2';
    console.log(`\n📊 Test 2: Search Index "${indexName}"\n`);
    
    const searchResponse = await fetch(
      `${endpoint}/indexes/${indexName}/docs/search?api-version=2024-07-01`,
      {
        method: 'POST',
        headers: {
          'api-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ search: 'test', top: 1 })
      }
    );
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`✅ Search successful!`);
      console.log(`   Documents in index: ${searchData['@odata.count'] || searchData.value?.length || 0}`);
    } else {
      console.log(`❌ Search failed: ${searchResponse.status}`);
    }
    
  } else {
    const error = await response.text();
    console.log(`❌ Admin key is INVALID`);
    console.log(`   HTTP ${response.status}: ${response.statusText}`);
    console.log(`   ${error}`);
    console.log('\n⚠️  The admin key does NOT match this service.');
    console.log('   Please verify you copied the key from:');
    console.log(`   Azure Portal → cardiologysuite-search-pro → Keys`);
  }
} catch (error) {
  console.log('❌ Network error:', error.message);
}
