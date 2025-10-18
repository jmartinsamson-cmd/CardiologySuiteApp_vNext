import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Buffer } from 'node:buffer';

describe('parseAzureNote heuristics', () => {
  it('extracts Assessment and Plan from AI summary', async () => {
    const { Readable } = await import('node:stream');
    const readable = Readable.from(['irrelevant raw file content']);

    const mockBlobSvc = {
      getContainerClient() {
        return {
          getBlobClient() {
            return {
              async download() {
                return { readableStreamBody: readable };
              },
            };
          },
          getBlockBlobClient() {
            return {
              async downloadToBuffer() {
                return Buffer.from('irrelevant buffer content', 'utf8');
              },
            };
          },
        };
      },
    };

    const mockOpenAI = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content:
                    'Assessment: NSTEMI with elevated troponin.\n\nPlan: Start Heparin drip, ASA 325mg, cardiology consult.',
                },
              },
            ],
          }),
        },
      },
    };

    globalThis.__TEST_OVERRIDES__ = { blobServiceClient: mockBlobSvc, openai: mockOpenAI };

    const { parseAzureNote } = await import('../../src/parsers/cardiology/index.js');
    const result = await parseAzureNote('cardiology-data', 'NSTEMI.txt');

    assert.ok(result);
    assert.equal(typeof result.sections.assessment, 'string');
    assert.equal(typeof result.sections.plan, 'string');
    assert.match(result.sections.assessment, /NSTEMI/i);
    assert.match(result.sections.plan, /Heparin|ASA|consult/i);
    assert.equal(result.meta.source, 'azure');
  });
});
