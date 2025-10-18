import { readFileSync } from "fs";
import { extractVitals } from "../src/parsers/entityExtraction.js";

const fixture = JSON.parse(
  readFileSync("tests/fixtures/real/note-hf-decompensated.json", "utf8"),
);

console.log("Testing vitals extraction for MIN/MAX format...\n");

// Check if the format marker exists
const hasMinMax = /VITAL SIGNS.*MIN.*MAX/i.test(fixture.input);
console.log("Has MIN/MAX marker:", hasMinMax);

// Extract the vitals section
const vitalSection = fixture.input.match(/VITAL SIGNS.*MIN.*MAX[\s\S]{0,500}/i);
if (vitalSection) {
  console.log("\n=== VITAL SECTION (first 400 chars) ===");
  console.log(vitalSection[0].substring(0, 400));
  console.log("=== END ===\n");
}

// Try extraction
const vitals = extractVitals(fixture.input);
console.log("Extracted vitals:", vitals);

console.log("\nExpected vitals:", fixture.expected.vitals);

// Check line-by-line
const lines = fixture.input.split("\n");
console.log("\n=== Checking lines around VITAL SIGNS ===");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/VITAL SIGNS/i.test(line)) {
    console.log(`Line ${i}: "${line}"`);
    for (let j = 1; j <= 6; j++) {
      if (lines[i + j]) {
        console.log(`Line ${i + j}: "${lines[i + j]}"`);
      }
    }
    break;
  }
}
