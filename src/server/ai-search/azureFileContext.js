/* eslint-env node */
import { Buffer } from "node:buffer";
import process from "node:process";
// Node-only utility to read cardiology files from Azure Blob and summarize with GPT-4o-mini
import { BlobServiceClient } from "@azure/storage-blob";
import OpenAI from "openai";

// Optional test overrides for deterministic unit tests
// globalThis.__TEST_OVERRIDES__ = {
//   blobServiceClient: {...},
//   openai: { chat: { completions: { create: async () => ({ choices:[{ message:{ content:"..."}}]})}}}
// }

let _blobSvc;
function getBlobServiceClient() {
  const override = globalThis.__TEST_OVERRIDES__?.blobServiceClient;
  if (override) return override;
  if (_blobSvc) return _blobSvc;
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  _blobSvc = BlobServiceClient.fromConnectionString(conn);
  return _blobSvc;
}

let _openai;
function getOpenAI() {
  const override = globalThis.__TEST_OVERRIDES__?.openai;
  if (override) return override;
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  _openai = new OpenAI({ apiKey });
  return _openai;
}

export async function streamToString(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (d) => chunks.push(Buffer.from(d)));
    readable.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    readable.on("error", reject);
  });
}

/**
 * Download a blob and summarize it with GPT-4o-mini.
 * @param {string} containerName
 * @param {string} blobName
 * @returns {Promise<string>} summary text
 */
export async function summarizeAzureFile(containerName, blobName) {
  const blobSvc = getBlobServiceClient();
  const container = blobSvc.getContainerClient(containerName);
  const blob = container.getBlobClient(blobName);

  let fileText = "";
  try {
    const download = await blob.download();
    if (download.readableStreamBody) {
      fileText = await streamToString(download.readableStreamBody);
    } else {
      const block = container.getBlockBlobClient(blobName);
      const buf = await block.downloadToBuffer();
      fileText = buf.toString("utf8");
    }
  } catch (err) {
    console.error(`Error downloading blob "${blobName}" from container "${containerName}":`, err);
    const block = container.getBlockBlobClient(blobName);
    const buf = await block.downloadToBuffer();
    fileText = buf.toString("utf8");
  }

  const openai = getOpenAI();
  const trimmed = (fileText || "").slice(0, 12000);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a cardiology documentation assistant. Summarize the following file for diagnostic extraction or teaching purposes." },
      { role: "user", content: trimmed || "(empty file)" },
    ],
    temperature: 0.2,
  });

  const summary = completion?.choices?.[0]?.message?.content?.trim() || "(no summary)";
  return summary;
}

export default { summarizeAzureFile, streamToString };
