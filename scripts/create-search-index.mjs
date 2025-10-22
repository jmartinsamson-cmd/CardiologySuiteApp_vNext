#!/usr/bin/env node
/* eslint-env node */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const svc = process.env.AZURE_SEARCH_NAME;
const key = process.env.AZURE_SEARCH_ADMIN_KEY;
const indexName = 'cardiology-index';

if (!svc || !key) {
  console.error('Error: AZURE_SEARCH_NAME and AZURE_SEARCH_ADMIN_KEY must be set');
  console.error('Example:');
  console.error('  AZURE_SEARCH_NAME=cardiologysuite-search AZURE_SEARCH_ADMIN_KEY=xxx npm run search:index:put');
  process.exit(1);
}

const endpoint = `https://${svc}.search.windows.net`;
const indexDefPath = path.resolve(__dirname, '../infra/search/cardiology-index.json');

console.log(`Creating index '${indexName}' on ${endpoint}...`);
console.log(`Reading definition from: ${indexDefPath}`);

try {
  const indexDef = JSON.parse(await fs.readFile(indexDefPath, 'utf-8'));
  
  const res = await fetch(
    `${endpoint}/indexes/${indexName}?api-version=2024-07-01`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key
      },
      body: JSON.stringify(indexDef)
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Index creation failed:', res.status, errorText);
    process.exit(1);
  }

  const result = await res.json();
  console.log('✅ Successfully created index:', indexName);
  console.log('Fields:', result.fields?.length || 0);
  console.log('Vector search configured:', !!result.vectorSearch);
} catch (error) {
  console.error('Error creating index:', error.message);
  process.exit(1);
}
