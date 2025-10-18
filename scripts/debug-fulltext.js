import { readFileSync } from "fs";
import { extractVitals } from "../src/parsers/entityExtraction.js";
import { normalize } from "../src/parsers/normalize.js";

const fixture = JSON.parse(
  readFileSync("tests/fixtures/real/note-hf-decompensated.json", "utf8"),
);

console.log("Testing vitals extraction on normalized fullText...\n");

// Simulate what smartParser does
const normalized = normalize(fixture.input);

console.log("=== Testing MIN/MAX detection ===");
const hasMinMax = /VITAL SIGNS.*MIN.*MAX/i.test(normalized);
console.log("Has MIN/MAX marker in normalized text:", hasMinMax);

if (!hasMinMax) {
  console.log("\n=== Checking original text ===");
  const hasMinMaxOrig = /VITAL SIGNS.*MIN.*MAX/i.test(fixture.input);
  console.log("Has MIN/MAX marker in original text:", hasMinMaxOrig);

  console.log("\n=== Sample from normalized (chars 1000-1500) ===");
  console.log(normalized.substring(1000, 1500));
}

console.log("\n=== Extracting vitals ===");
const vitals = extractVitals(normalized);
console.log("Result:", vitals);
