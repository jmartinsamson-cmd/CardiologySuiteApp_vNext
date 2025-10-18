#!/usr/bin/env node

/**
 * CLI Parse Runner - Debug Tool for User Issue Reproduction
 *
 * Usage: node scripts/parse.js <file-path> [--verbose]
 *
 * Pipes a clinical note through the parser and prints:
 * - JSON summary of extracted data
 * - Confidence score
 * - Detected sections
 * - Warnings
 * - Required field validation
 *
 * Exit codes:
 * - 0: Success (confidence >= 0.5, required fields present)
 * - 1: Failure (low confidence or missing critical fields)
 * - 2: Invalid usage or file not found
 *
 * Use this for quick repros when users report "no note generated"
 */

import { parseNote } from "../src/parsers/smartParser.js";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(`
📝 Clinical Note Parser - Debug Tool

Usage: node scripts/parse.js <file-path> [--verbose]

Arguments:
  <file-path>    Path to text file containing clinical note
  --verbose, -v  Show detailed section breakdown and raw data

Exit codes:
  0  Success (confidence >= 0.5, required fields present)
  1  Failure (low confidence or missing critical fields)
  2  Invalid usage or file not found

Examples:
  node scripts/parse.js sample-notes/hpi.txt
  node scripts/parse.js user-report.txt --verbose
  `);
  process.exit(args.length === 0 ? 2 : 0);
}

const filePath = args[0];

if (!fs.existsSync(filePath)) {
  console.error(`❌ Error: File not found: ${filePath}`);
  console.error(`   Current directory: ${process.cwd()}`);
  process.exit(2);
}

const text = fs.readFileSync(filePath, "utf-8");

// Parse with error handling
let result;
try {
  result = parseNote(text);
} catch (error) {
  console.error(`❌ Parser crashed with error:`);
  console.error(`   ${error.message}`);
  console.error(`\n   Stack trace:`);
  console.error(error.stack);
  process.exit(1);
}

// Print summary
console.log(`\n📄 Parsing: ${path.basename(filePath)}`);
console.log(`${"=".repeat(60)}\n`);

// Input stats
console.log(`📝 Input:`);
console.log(`   File size: ${text.length} characters`);
console.log(`   Lines: ${text.split("\n").length}`);
console.log(`   Words: ${text.split(/\s+/).length}`);

// Parse results
console.log(`\n🔍 Parse Results:`);
const confidencePercent = (result.confidence * 100).toFixed(1);
const confidenceEmoji =
  result.confidence >= 0.8 ? "✅" : result.confidence >= 0.5 ? "⚠️" : "❌";
console.log(`   Confidence: ${confidenceEmoji} ${confidencePercent}%`);
console.log(
  `   Sections detected: ${Object.keys(result.raw?.sections || {}).length}`,
);
console.log(`   Warnings: ${result.warnings?.length || 0}`);

if (result.warnings && result.warnings.length > 0) {
  console.log(`\n⚠️  Warnings:`);
  result.warnings.forEach((w) => console.log(`   - ${w}`));
}

// Sections breakdown (verbose mode)
if (verbose && result.raw?.sections) {
  console.log(`\n📑 Detected Sections:`);
  Object.entries(result.raw.sections).forEach(([name, content]) => {
    console.log(
      `   - ${name}: ${typeof content === "string" ? content.length + " chars" : "N/A"}`,
    );
  });
}

// Print structured output summary
console.log(`\n📊 Extracted Data:`);
console.log(`   Patient:`);
console.log(`      Age: ${result.data.patient?.age || "N/A"}`);
console.log(`      Gender: ${result.data.patient?.gender || "N/A"}`);

console.log(
  `   Vitals: ${Object.keys(result.data.vitals || {}).length} measurements`,
);
if (result.data.vitals && Object.keys(result.data.vitals).length > 0) {
  for (const [key, value] of Object.entries(result.data.vitals)) {
    console.log(`      ${key}: ${JSON.stringify(value)}`);
  }
}

const medsCount = (result.data.meds || []).length;
const medsEmoji = medsCount > 0 ? "💊" : "○";
console.log(`   Medications: ${medsEmoji} ${medsCount} items`);
if (verbose && medsCount > 0) {
  result.data.meds.forEach((med, i) => {
    console.log(`      ${i + 1}. ${med}`);
  });
}

const allergiesCount = (result.data.allergies || []).length;
const allergiesEmoji = allergiesCount > 0 ? "⚠️" : "○";
console.log(`   Allergies: ${allergiesEmoji} ${allergiesCount} items`);
if (verbose && allergiesCount > 0) {
  result.data.allergies.forEach((allergy, i) => {
    console.log(`      ${i + 1}. ${allergy}`);
  });
}

const diagnosesCount = (result.data.diagnoses || []).length;
const diagnosesEmoji = diagnosesCount > 0 ? "🏥" : "○";
console.log(`   Diagnoses: ${diagnosesEmoji} ${diagnosesCount} items`);
if (verbose && diagnosesCount > 0) {
  result.data.diagnoses.forEach((dx, i) => {
    console.log(`      ${i + 1}. ${dx}`);
  });
}

const assessmentEmoji = result.data.assessment ? "✅" : "❌";
console.log(
  `   Assessment: ${assessmentEmoji} ${result.data.assessment ? result.data.assessment.length + " chars" : "MISSING"}`,
);
if (verbose && result.data.assessment) {
  console.log(`      Preview: ${result.data.assessment.substring(0, 100)}...`);
}

const planEmoji = result.data.plan ? "✅" : "❌";
console.log(
  `   Plan: ${planEmoji} ${result.data.plan ? result.data.plan.length + " chars" : "MISSING"}`,
);
if (verbose && result.data.plan) {
  console.log(`      Preview: ${result.data.plan.substring(0, 100)}...`);
}

// Print full JSON (summarized unless verbose)
console.log(`\n📋 Full Result (JSON):`);
const jsonOutput = {
  confidence: result.confidence,
  warnings: result.warnings || [],
  sections_detected: Object.keys(result.raw?.sections || {}),
  data: {
    patient: result.data.patient,
    vitals: result.data.vitals,
    meds: result.data.meds,
    allergies: result.data.allergies,
    diagnoses: result.data.diagnoses,
    assessment:
      verbose && result.data.assessment
        ? result.data.assessment
        : result.data.assessment
          ? `[${result.data.assessment.length} chars]`
          : null,
    plan:
      verbose && result.data.plan
        ? result.data.plan
        : result.data.plan
          ? `[${result.data.plan.length} chars]`
          : null,
  },
};

console.log(JSON.stringify(jsonOutput, null, 2));

// Validation checks
console.log(`\n🔬 Validation:`);

const criticalMissing = !result.data.assessment && !result.data.plan;
const lowConfidence = result.confidence < 0.5;
const noSections = Object.keys(result.raw?.sections || {}).length === 0;
const noData =
  !result.data.patient &&
  Object.keys(result.data.vitals || {}).length === 0 &&
  (!result.data.meds || result.data.meds.length === 0) &&
  (!result.data.diagnoses || result.data.diagnoses.length === 0);

console.log(
  `   Required fields (assessment or plan): ${criticalMissing ? "❌ FAIL" : "✅ PASS"}`,
);
console.log(`   Confidence >= 0.5: ${lowConfidence ? "❌ FAIL" : "✅ PASS"}`);
console.log(`   Sections detected: ${noSections ? "❌ FAIL" : "✅ PASS"}`);
console.log(`   Some data extracted: ${noData ? "⚠️  WARN" : "✅ PASS"}`);

// Exit code logic
if (criticalMissing || lowConfidence) {
  console.log(
    `\n❌ FAIL: ${criticalMissing ? "Critical fields missing (assessment/plan)" : `Low confidence (${confidencePercent}% < 50%)`}`,
  );
  console.log(`\n💡 Possible reasons:`);
  if (criticalMissing) {
    console.log(`   - Note is too short or incomplete`);
    console.log(`   - Missing standard section headers (Assessment, Plan)`);
    console.log(`   - Unstructured text without clear sections`);
  }
  if (lowConfidence) {
    console.log(`   - Parser couldn't identify standard note sections`);
    console.log(`   - Non-standard formatting or headers`);
    console.log(`   - Content doesn't match expected clinical note structure`);
  }
  console.log(`\n💡 Try adding clear section headers like:`);
  console.log(`   ASSESSMENT: <clinical impression>`);
  console.log(`   PLAN: <management plan>`);
  process.exit(1);
} else {
  console.log(`\n✅ PASS - Note parsed successfully`);
  console.log(`   Confidence: ${confidencePercent}%`);
  console.log(`   Required fields: Present`);
  process.exit(0);
}
