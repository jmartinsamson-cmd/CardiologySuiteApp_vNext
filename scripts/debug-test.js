import { parseNote } from "../src/parsers/smartParser.js";
import { extractVitals } from "../src/parsers/entityExtraction.js";
import fs from "fs";

const text = fs.readFileSync("./tests/fixtures/06-inline-vitals.txt", "utf-8");
const result = parseNote(text);

console.log("Has objective:", !!result.raw.sections.objective);
console.log("Objective length:", result.raw.sections.objective?.length);
console.log("Has subjective:", !!result.raw.sections.subjective);
console.log("Subjective length:", result.raw.sections.subjective?.length);
console.log("\nObjective content:", result.raw.sections.objective);
console.log("\nTest extraction directly from subjective:");
const vitalsFromSubj = extractVitals(result.raw.sections.subjective);
console.log("Vitals:", vitalsFromSubj);
