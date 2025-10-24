#!/usr/bin/env node
/**
 * Comprehensive Azure Services Test Report
 */
import 'dotenv/config';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   AZURE SERVICES TEST REPORT');
console.log('   Date:', new Date().toISOString());
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Azure AI Search Configuration
console.log('📊 TEST 1: Azure AI Search Configuration\n');
const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
const searchKey = process.env.AZURE_SEARCH_API_KEY;
const searchIndex = process.env.AZURE_SEARCH_INDEX;
const searchService = process.env.AZURE_SEARCH_SERVICE_NAME || process.env.AZURE_SEARCH_NAME;

console.log('  Environment Variables:');
console.log('    AZURE_SEARCH_ENDPOINT:', searchEndpoint || '❌ Not set');
console.log('    AZURE_SEARCH_SERVICE_NAME:', searchService || '❌ Not set');
console.log('    AZURE_SEARCH_INDEX:', searchIndex || '❌ Not set');
console.log('    AZURE_SEARCH_API_KEY:', searchKey ? '✅ Set (***hidden***)' : '❌ Not set');

if (searchEndpoint && searchKey && searchIndex) {
  console.log('\n  Testing search endpoint...');
  
  try {
    const url = `${searchEndpoint}/indexes/${searchIndex}/docs/search?api-version=2024-07-01`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': searchKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        search: 'test',
        top: 1
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('  ✅ PASS - Azure AI Search is accessible');
      console.log(`     Found ${data['@odata.count'] || data.value?.length || 0} documents in index`);
    } else {
      console.log('  ❌ FAIL - Search request failed');
      console.log(`     HTTP ${response.status}: ${response.statusText}`);
      if (response.status === 403) {
        console.log('     ⚠️  API key mismatch - key is from old service');
        console.log('     ACTION: Update AZURE_SEARCH_API_KEY with key from cardiologysuite-search-pro');
      }
    }
  } catch (error) {
    console.log('  ❌ FAIL - Network error:', error.message);
  }
} else {
  console.log('  ⚠️  SKIP - Missing required environment variables');
}

// Test 2: Azure OpenAI Configuration
console.log('\n\n📊 TEST 2: Azure OpenAI Configuration\n');
const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openaiKey = process.env.AZURE_OPENAI_API_KEY;
const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

console.log('  Environment Variables:');
console.log('    AZURE_OPENAI_ENDPOINT:', openaiEndpoint || '❌ Not set');
console.log('    AZURE_OPENAI_API_KEY:', openaiKey ? '✅ Set (***hidden***)' : '❌ Not set');
console.log('    AZURE_OPENAI_DEPLOYMENT:', openaiDeployment || '❌ Not set');

if (openaiEndpoint && openaiKey && openaiDeployment) {
  console.log('\n  Testing OpenAI endpoint...');
  
  try {
    const url = `${openaiEndpoint}/openai/deployments/${openaiDeployment}/chat/completions?api-version=2024-10-21-preview`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'api-key': openaiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5
      })
    });

    if (response.ok) {
      console.log('  ✅ PASS - Azure OpenAI is accessible');
    } else {
      console.log('  ❌ FAIL - OpenAI request failed');
      console.log(`     HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log('  ❌ FAIL - Network error:', error.message);
  }
} else {
  console.log('  ⚠️  SKIP - Missing required environment variables');
}

// Test 3: OCR Service
console.log('\n\n📊 TEST 3: OCR Container App\n');
const ocrUrl = 'https://cardiology-ocr-app.politesky-ff2385f1.eastus.azurecontainerapps.io/health';

console.log('  Container App URL:', ocrUrl);
console.log('\n  Testing health endpoint...');

try {
  const response = await fetch(ocrUrl, { 
    method: 'GET',
    signal: AbortSignal.timeout(5000) 
  });
  
  if (response.ok) {
    const data = await response.text();
    console.log('  ✅ PASS - OCR service is running');
    console.log('     Response:', data);
  } else {
    console.log('  ❌ FAIL - OCR service responded with error');
    console.log(`     HTTP ${response.status}: ${response.statusText}`);
  }
} catch (error) {
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    console.log('  ⚠️  TIMEOUT - OCR service did not respond within 5 seconds');
  } else {
    console.log('  ❌ FAIL - Cannot reach OCR service');
  }
  console.log('     Error:', error.message);
  console.log('\n     Possible reasons:');
  console.log('       - Container app is stopped or scaled to zero');
  console.log('       - Health endpoint not implemented');
  console.log('       - Deployment in progress');
  console.log('\n     ACTION: Check Azure Portal → Container Apps → cardiology-ocr-app');
}

// Summary
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Required Actions:');
console.log('  1. Update AZURE_SEARCH_API_KEY in .env with key from cardiologysuite-search-pro');
console.log('  2. Verify OCR container app is running in Azure Portal');
console.log('  3. Re-run this test after updates: node test-services.js\n');
