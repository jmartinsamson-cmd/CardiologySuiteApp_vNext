import { readFileSync } from "fs";
import { parseNote } from "../src/parsers/smartParser.js";

const fixture = JSON.parse(
  readFileSync("tests/fixtures/real/note-hf-decompensated.json", "utf8"),
);

console.log("Testing section detection for note-hf-decompensated...\n");

const result = parseNote(fixture.input);

console.log("=== DETECTED SECTIONS ===");
console.log("Sections found:", Object.keys(result.raw.sections));
console.log("\n");

if (result.raw.sections.objective) {
  console.log("Objective section (first 500 chars):");
  console.log(result.raw.sections.objective.substring(0, 500));
  console.log("...\n");

  const hasVitals = /VITAL SIGNS/i.test(result.raw.sections.objective);
  console.log("Has VITAL SIGNS in objective:", hasVitals);
}

console.log("\n=== PARSED VITALS ===");
console.log("Vitals:", result.data.vitals);

console.log("\n=== WARNINGS ===");
console.log(result.warnings);
