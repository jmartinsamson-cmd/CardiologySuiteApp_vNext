#!/usr/bin/env node
import { parseAzureNote } from "../src/parsers/cardiology/index.js";

async function main() {
  const [container, blob] = process.argv.slice(2);
  if (!container || !blob) {
    console.error("Usage: node scripts/analyze-note.js <container> <blobName>");
    process.exit(1);
  }
  try {
    const result = await parseAzureNote(container, blob);
    console.log("Assessment:\n", result.sections.assessment || "<none>");
    console.log("\nPlan:\n", result.sections.plan || "<none>");
  } catch (e) {
    console.error("Error:", e?.message || e);
    process.exit(2);
  }
}

main();
