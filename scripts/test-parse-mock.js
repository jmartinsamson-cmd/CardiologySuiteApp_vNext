#!/usr/bin/env node
// @ts-nocheck
// Quick test harness: inject test overrides and call parseAzureNote directly
// Note: __filename and __dirname are available for future use if needed
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure ES module resolution works from repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // eslint-disable-line no-unused-vars

// Small mock: override blobServiceClient and openai used by azureFileContext
globalThis.__TEST_OVERRIDES__ = {
  blobServiceClient: {
    getContainerClient: (_name) => ({
      getBlobClient: (_blobName) => ({
        // force download() to throw so code uses block.downloadToBuffer fallback
        download: async () => { throw new Error('mock download not implemented'); },
      }),
      getBlockBlobClient: (_blobName) => ({
        downloadToBuffer: async () => Buffer.from('Chief complaint: chest pain\nTroponin: elevated\nECG: ST depressions consistent with ischemia.\nImpression: NSTEMI.\nPlan: start aspirin, heparin, call cardiology for urgent cath.'),
      }),
    }),
  },
  openai: {
    chat: {
      completions: {
        create: async (_opts) => {
          // Return a deterministic summary similar to what the real model would
          return {
            choices: [
              {
                message: {
                  content: `Assessment: NSTEMI\n\nPlan:\n- Aspirin 325 mg loading dose\n- Heparin infusion\n- Cardiology consult for urgent coronary angiography\n- Monitor troponins and vitals`,
                },
              },
            ],
          };
        },
      },
    },
  },
};

// Load and run parser
import { parseAzureNote } from '../src/parsers/cardiology/index.js';

async function main() {
  try {
    const result = await parseAzureNote('cardiology-data', 'NSTEMI_case.txt');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error running parseAzureNote:', err?.message || err);
    process.exit(1);
  }
}

main();
