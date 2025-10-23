// @ts-nocheck
import { parseNote } from "../src/parsers/smartParser.js";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(
  readFileSync("./tests/fixtures/real/note-pneumonia-trach.json", "utf-8"),
);
const result = /** @type {any} */ (parseNote(fixture.input));

console.log("\n📋 Sections detected:");
for (const [key, value] of Object.entries(result.raw.sections)) {
  console.log(`\nSection: ${key} (${value.length} chars)`);
  // Check if vitals table is in this section
  if (
    value.includes("BP") &&
    value.includes("Pulse") &&
    value.includes("SpO2")
  ) {
    console.log("  ✅ Contains vitals table header!");

    // Find the vitals lines
    const lines = value.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("BP") && lines[i].includes("Pulse")) {
        console.log(`  Line ${i}: "${lines[i]}"`);
        console.log(`  Line ${i + 1}: "${lines[i + 1]}"`);
        console.log(`  Line ${i + 2}: "${lines[i + 2]}"`);
        break;
      }
    }
  }
}

console.log("\n💓 Vitals extracted:", result.data.vitals);
console.log("\n⚠️  Warnings:", result.warnings);
