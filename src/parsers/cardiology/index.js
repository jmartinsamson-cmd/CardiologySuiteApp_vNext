// Minimal cardiology Azure entry: fetch summary from Azure + return structured JSON
import { summarizeAzureFile } from "../../server/ai-search/azureFileContext.js";

/**
 * Parse a cardiology note stored in Azure by first summarizing with GPT-4o-mini.
 * Returns a structured object focusing on Assessment and Plan sections.
 * This is backend-only. Do not call from browser.
 */
export async function parseAzureNote(containerName, blobName) {
  const summary = await summarizeAzureFile(containerName, blobName);

  // Heuristic split: try to locate Assessment/Plan in summary
  const sections = { assessment: "", plan: "" };
  const text = summary || "";
  const parts = text.split(/\n-{3,}\n|\n\n+/);
  const joined = parts.join("\n");

  // Extract lines starting with dash under Plan-like phrases
  const assessMatch = joined.match(/(?:Assessment|Impression)[:\-\s]*([\s\S]{0,2000})/i);
  const planMatch = joined.match(/(?:Plan|Recommendations)[:\-\s]*([\s\S]{0,2000})/i);
  sections.assessment = (assessMatch?.[1] || joined).trim().slice(0, 4000);
  sections.plan = (planMatch?.[1] || joined).trim().slice(0, 4000);

  return {
    sections,
    entities: {
      diagnoses: [],
      medications: [],
      labs: [],
      imaging: [],
      procedures: [],
    },
    meta: {
      source: "azure",
      container: containerName,
      blob: blobName,
      timestamp: new Date().toISOString(),
    },
  };
}

export default { parseAzureNote };
