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
const index = process.env.AZURE_SEARCH_INDEX || 'cardiology-index';

if (!svc || !key) {
  console.error('Error: AZURE_SEARCH_NAME and AZURE_SEARCH_ADMIN_KEY must be set');
  process.exit(1);
}

const endpoint = `https://${svc}.search.windows.net`;

// Sample cardiology documents
const docs = [
  {
    id: "sample-1",
    title: "ACC/AHA NSTEMI Guidelines",
    sourceId: "blob://guidelines/acc_nstemi.pdf#0",
    url: "https://www.ahajournals.org/nstemi-guidelines",
    chunkIndex: 0,
    createdAt: new Date().toISOString(),
    content: "Initial ACS evaluation includes ECG within 10 minutes, troponin measurement, and risk stratification using TIMI or GRACE scores. Early invasive strategy is recommended for high-risk patients.",
    embedding: [] // Empty for now; would populate with actual embeddings
  },
  {
    id: "sample-2",
    title: "Heart Failure Management - ESC Guidelines",
    sourceId: "blob://guidelines/esc_hf.pdf#0",
    url: "https://www.escardio.org/guidelines/heart-failure",
    chunkIndex: 0,
    createdAt: new Date().toISOString(),
    content: "HFrEF management includes ACE inhibitors or ARBs, beta-blockers, MRAs, and SGLT2 inhibitors. Target NT-proBNP <1000 pg/mL for optimal outcomes.",
    embedding: []
  },
  {
    id: "sample-3",
    title: "Atrial Fibrillation - Anticoagulation",
    sourceId: "blob://guidelines/afib_anticoag.pdf#0",
    url: "https://www.ahajournals.org/afib-guidelines",
    chunkIndex: 0,
    createdAt: new Date().toISOString(),
    content: "CHA2DS2-VASc score guides anticoagulation decisions. Score ≥2 in males or ≥3 in females warrants oral anticoagulation. DOACs preferred over warfarin in most patients.",
    embedding: []
  },
  {
    id: "sample-4",
    title: "Aortic Stenosis - Intervention Criteria",
    sourceId: "blob://guidelines/as_intervention.pdf#0",
    url: "https://www.acc.org/aortic-stenosis",
    chunkIndex: 0,
    createdAt: new Date().toISOString(),
    content: "Severe AS defined as AVA <1.0 cm², mean gradient >40 mmHg, or peak velocity >4.0 m/s. TAVR or SAVR indicated for symptomatic severe AS or asymptomatic with LVEF <50%.",
    embedding: []
  },
  {
    id: "sample-5",
    title: "Acute Decompensated Heart Failure",
    sourceId: "blob://guidelines/adhf.pdf#0",
    url: "https://www.escardio.org/acute-hf",
    chunkIndex: 0,
    createdAt: new Date().toISOString(),
    content: "ADHF management includes IV diuretics, vasodilators if SBP >110 mmHg, and inotropes for cardiogenic shock. Monitor daily weights, I/O, and renal function closely.",
    embedding: []
  }
];

const payload = {
  value: docs.map(d => ({
    '@search.action': 'mergeOrUpload',
    ...d
  }))
};

console.log(`Indexing ${docs.length} documents to ${endpoint}/indexes/${index}...`);

try {
  const res = await fetch(
    `${endpoint}/indexes/${index}/docs/index?api-version=2024-07-01`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Indexing failed:', res.status, errorText);
    process.exit(1);
  }

  const result = await res.json();
  console.log('✅ Successfully indexed', docs.length, 'documents');
  console.log('Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error indexing documents:', error.message);
  process.exit(1);
}
