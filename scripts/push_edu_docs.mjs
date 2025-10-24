#!/usr/bin/env node
/* eslint-env node */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Prefer AZURE_SEARCH_ENDPOINT, fallback to constructing from SERVICE_NAME
const endpoint = process.env.AZURE_SEARCH_ENDPOINT || 
  (process.env.AZURE_SEARCH_SERVICE_NAME 
    ? `https://${process.env.AZURE_SEARCH_SERVICE_NAME}.search.windows.net`
    : null);
const key = process.env.AZURE_SEARCH_API_KEY || process.env.AZURE_SEARCH_ADMIN_KEY;
const index = process.env.AZURE_SEARCH_INDEX || 'edu-index-v2';

if (!endpoint || !key) {
  console.error('Error: AZURE_SEARCH_ENDPOINT (or AZURE_SEARCH_SERVICE_NAME) and AZURE_SEARCH_API_KEY must be set');
  process.exit(1);
}

// Sample docs matching edu-index-v2 schema (blob indexer + custom fields)
const docs = [
  {
    id: "sample-edu-1",
    metadata_storage_name: "acc_nstemi_guidelines.pdf",
    content: "Initial ACS evaluation includes ECG within 10 minutes, troponin measurement, and risk stratification using TIMI or GRACE scores. Early invasive strategy is recommended for high-risk patients with positive troponin, ongoing chest pain, or hemodynamic instability.",
    metadata_storage_path: "https://cardiologysuitepub.blob.core.windows.net/education/guidelines/acc_nstemi.pdf",
    language: "en",
    keyPhrases: ["ACS evaluation", "ECG", "troponin", "TIMI score", "GRACE score", "invasive strategy"],
    fileName: "acc_nstemi_guidelines.pdf",
    url: "https://www.ahajournals.org/nstemi-guidelines",
    condition: "NSTEMI",
    docType: "guideline",
    year: "2023"
  },
  {
    id: "sample-edu-2",
    metadata_storage_name: "esc_heart_failure.pdf",
    content: "HFrEF management includes ACE inhibitors or ARBs, beta-blockers, MRAs, and SGLT2 inhibitors as foundational therapy. Target NT-proBNP <1000 pg/mL for optimal outcomes. Device therapy (ICD, CRT) indicated for LVEF ≤35% despite optimal medical therapy.",
    metadata_storage_path: "https://cardiologysuitepub.blob.core.windows.net/education/guidelines/esc_hf.pdf",
    language: "en",
    keyPhrases: ["HFrEF", "ACE inhibitors", "beta-blockers", "SGLT2 inhibitors", "NT-proBNP", "ICD", "CRT"],
    fileName: "esc_heart_failure.pdf",
    url: "https://www.escardio.org/guidelines/heart-failure",
    condition: "Heart Failure",
    docType: "guideline",
    year: "2023"
  },
  {
    id: "sample-edu-3",
    metadata_storage_name: "afib_anticoagulation.pdf",
    content: "CHA2DS2-VASc score guides anticoagulation decisions in atrial fibrillation. Score ≥2 in males or ≥3 in females warrants oral anticoagulation. DOACs (apixaban, rivaroxaban, edoxaban, dabigatran) preferred over warfarin in most patients due to lower bleeding risk and no need for monitoring.",
    metadata_storage_path: "https://cardiologysuitepub.blob.core.windows.net/education/guidelines/afib_anticoag.pdf",
    language: "en",
    keyPhrases: ["atrial fibrillation", "CHA2DS2-VASc", "anticoagulation", "DOACs", "warfarin"],
    fileName: "afib_anticoagulation.pdf",
    url: "https://www.ahajournals.org/afib-guidelines",
    condition: "Atrial Fibrillation",
    docType: "guideline",
    year: "2024"
  },
  {
    id: "sample-edu-4",
    metadata_storage_name: "aortic_stenosis.pdf",
    content: "Severe aortic stenosis defined as AVA <1.0 cm², mean gradient >40 mmHg, or peak velocity >4.0 m/s. TAVR or SAVR indicated for symptomatic severe AS (angina, syncope, dyspnea) or asymptomatic with LVEF <50%. Risk stratification guides choice between TAVR vs SAVR.",
    metadata_storage_path: "https://cardiologysuitepub.blob.core.windows.net/education/guidelines/as_intervention.pdf",
    language: "en",
    keyPhrases: ["aortic stenosis", "AVA", "mean gradient", "TAVR", "SAVR", "LVEF"],
    fileName: "aortic_stenosis.pdf",
    url: "https://www.acc.org/aortic-stenosis",
    condition: "Aortic Stenosis",
    docType: "guideline",
    year: "2023"
  },
  {
    id: "sample-edu-5",
    metadata_storage_name: "adhf_management.pdf",
    content: "Acute decompensated heart failure management includes IV loop diuretics (furosemide, bumetanide), vasodilators (nitroglycerin, nitroprusside) if SBP >110 mmHg, and inotropes (dobutamine, milrinone) for cardiogenic shock. Monitor daily weights, strict I/O, and renal function. Transition to oral diuretics when euvolemic.",
    metadata_storage_path: "https://cardiologysuitepub.blob.core.windows.net/education/guidelines/adhf.pdf",
    language: "en",
    keyPhrases: ["ADHF", "IV diuretics", "vasodilators", "inotropes", "cardiogenic shock", "euvolemia"],
    fileName: "adhf_management.pdf",
    url: "https://www.escardio.org/acute-hf",
    condition: "Acute Heart Failure",
    docType: "guideline",
    year: "2024"
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
  console.log('✅ Successfully indexed', docs.length, 'documents to edu-index-v2');
  console.log(`   Service: ${endpoint}`);
  console.log(`   Index: ${index}`);
  console.log('\nIndexing results:');
  for (const r of result.value) {
    console.log(`   ${r.key}: ${r.status ? '✅ success' : '❌ failed'} (${r.statusCode})`);
  }
} catch (error) {
  console.error('Error indexing documents:', error.message);
  process.exit(1);
}
