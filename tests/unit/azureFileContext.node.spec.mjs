import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Buffer } from 'node:buffer';
import process from 'node:process';

describe('azureFileContext summarizeAzureFile', () => {
  it('uses OpenAI once and returns a non-empty string', async () => {
    const { Readable } = await import('node:stream');
    const readable = Readable.from(['NSTEMI case text']);

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
                return Buffer.from('NSTEMI buffer text', 'utf8');
              },
            };
          },
        };
      },
    };

    let calls = 0;
    const mockOpenAI = {
      chat: {
        completions: {
          create: async () => {
            calls += 1;
            return { choices: [{ message: { content: 'Summarized text' } }] };
          },
        },
      },
    };

    globalThis.__TEST_OVERRIDES__ = { blobServiceClient: mockBlobSvc, openai: mockOpenAI };
    const mod = await import('../../src/server/ai-search/azureFileContext.js').catch(async () => {
      // Fallback absolute path resolution in some runners
      return await import(process.cwd() + '/src/server/ai-search/azureFileContext.js');
    });

    const out = await mod.summarizeAzureFile('cardiology-data', 'NSTEMI.txt');
    assert.equal(typeof out, 'string');
    assert.ok(out.length > 0);
    assert.equal(calls, 1);
  });
});
