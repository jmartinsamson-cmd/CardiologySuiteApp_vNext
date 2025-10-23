// @ts-nocheck
import { parseNote } from "../src/parsers/smartParser.js";
import { extractVitals } from "../src/parsers/entityExtraction.js";
import fs from "node:fs";

const text = fs.readFileSync("./tests/fixtures/06-inline-vitals.txt", "utf-8");
const result = /** @type {any} */ (parseNote(text));

console.log("Has objective:", !!result.raw.sections.objective);
console.log("Objective length:", result.raw.sections.objective?.length);
console.log("Has subjective:", !!result.raw.sections.subjective);
console.log("Subjective length:", result.raw.sections.subjective?.length);
console.log("\nObjective content:", result.raw.sections.objective);
console.log("\nTest extraction directly from subjective:");
const vitalsFromSubj = extractVitals(result.raw.sections.subjective);
console.log("Vitals:", vitalsFromSubj);

// Extra debug: print parser warnings and map to rule origins
console.log("\nWarnings (detailed):");
/** @type {Array<{test: (w: string) => boolean, rule: string}>} */
const ruleMap = [
	{
		test: (w) => w.includes("Few explicit headers"),
		rule: "detectSections: fallback used (headers < 2)",
	},
	{
		test: (w) => w.includes("CRITICAL: Both assessment and plan are missing"),
		rule: "validateSchema: missing assessment AND plan",
	},
	{
		test: (w) => w.includes("Subjective/HPI section is missing"),
		rule: "validateSchema: subjective length < 10",
	},
	{
		test: (w) => w === "No vitals detected",
		rule: "validateSchema: vitals object empty",
	},
	{
		test: (w) => w.includes("Incomplete vitals"),
		rule: "validateSchema: vitals present but < 3 measurements",
	},
	{
		test: (w) => w === "No medications detected",
		rule: "validateSchema: meds array empty",
	},
	{
		test: (w) => w === "No diagnoses extracted from assessment",
		rule: "validateSchema: diagnoses array empty",
	},
	{
		test: (w) => w === "Patient age not detected",
		rule: "validateSchema: demographics.age missing",
	},
	{
		test: (w) => w === "Patient gender not detected",
		rule: "validateSchema: demographics.gender missing",
	},
];

for (const w of result.warnings || []) {
	const match = ruleMap.find((r) => r.test(w));
	if (match) {
		console.log(`- ${w}  ← ${match.rule}`);
	} else {
		console.log(`- ${w}`);
	}
}
