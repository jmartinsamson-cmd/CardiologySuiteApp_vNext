#!/usr/bin/env node
/**
 * Test Azure OpenAI GPT-4 mini connection
 */
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21-preview';

console.log('\n🔍 Azure OpenAI Configuration Check\n');
console.log('━'.repeat(50));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log(`  AZURE_OPENAI_ENDPOINT: ${endpoint ? '✓ Set' : '✗ Missing'}`);
console.log(`  AZURE_OPENAI_API_KEY: ${apiKey ? '✓ Set (***hidden***)' : '✗ Missing'}`);
console.log(`  AZURE_OPENAI_DEPLOYMENT: ${deployment}`);
console.log(`  AZURE_OPENAI_API_VERSION: ${apiVersion}`);

if (!endpoint || !apiKey) {
  console.log('\n❌ Missing required environment variables!');
  console.log('\nTo configure, create a .env file with:');
  console.log('  AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com');
  console.log('  AZURE_OPENAI_API_KEY=your-api-key-here');
  console.log('  AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini');
  process.exit(1);
}

// Test connection
console.log('\n🔌 Testing connection...');
console.log(`  Full URL: ${endpoint}/openai/deployments/${deployment}/chat/completions`);

try {
  const openai = new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deployment}`,
    defaultQuery: { 'api-version': apiVersion },
    defaultHeaders: {
      'api-key': apiKey,
    },
  });

  const testPrompt = 'Say "Hello from GPT-4 mini!" if you receive this.';
  
  console.log(`  Sending test request to: ${deployment}...`);
  
  const response = await openai.chat.completions.create({
    messages: [{ role: 'user', content: testPrompt }],
    max_tokens: 50,
    temperature: 0.5,
  });

  const message = response.choices[0]?.message?.content || '(no response)';
  
  console.log('\n✅ Connection successful!');
  console.log(`\n💬 Response: ${message}`);
  console.log(`\n📊 Model: ${response.model || deployment}`);
  console.log(`📊 Tokens used: ${response.usage?.total_tokens || 'unknown'}`);
  console.log('\n✨ Your Azure AI GPT-4 mini is functioning properly!\n');

} catch (error) {
  console.log('\n❌ Connection failed!');
  console.log(`\nError: ${error.message}`);
  
  if (error.status) {
    console.log(`Status: ${error.status}`);
  }
  
  if (error.code) {
    console.log(`Code: ${error.code}`);
  }
  
  console.log('\n📝 Troubleshooting tips:');
  console.log('  1. Verify your API key is valid');
  console.log('  2. Check that the endpoint URL is correct');
  console.log('  3. Ensure the deployment name matches your Azure resource');
  console.log('  4. Verify network connectivity to Azure\n');
  
  process.exit(1);
}
