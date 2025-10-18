/**
 * Smart Parser Test Suite
 * Tests fault-tolerant parsing with 10 fixtures covering edge cases
 */

import { parseNote, fallbackParse } from "../src/parsers/smartParser.js";
import { normalize } from "../src/parsers/normalize.js";
import { extractVitals, extractMeds } from "../src/parsers/entityExtraction.js";
import { scoreMatch } from "../src/parsers/synonyms.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load fixture
function loadFixture(filename) {
  const fixturePath = path.join(__dirname, "fixtures", filename);
  return fs.readFileSync(fixturePath, "utf-8");
}

// Test helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertGreater(actual, expected, label) {
  if (actual <= expected) {
    throw new Error(`Expected ${label} (${actual}) to be > ${expected}`);
  }
}

function assertIncludes(haystack, needle, label) {
  if (!haystack || !haystack.includes(needle)) {
    throw new Error(`Expected ${label} to include "${needle}"`);
  }
}

// Test Suite
console.log("🧪 Running Smart Parser Tests\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error.message}\n`);
    failed++;
  }
}

// === FIXTURE TESTS ===

test("01: Clean structured note", () => {
  const text = loadFixture("01-clean-structured.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.7, "confidence");
  assert(result.data.subjective, "has subjective");
  assert(result.data.objective, "has objective");
  assert(result.data.assessment, "has assessment");
  assert(result.data.plan, "has plan");
  assertGreater(Object.keys(result.data.vitals).length, 3, "vitals count");
  assertIncludes(result.data.assessment, "NSTEMI", "assessment content");
});

test("02: Out of order sections", () => {
  const text = loadFixture("02-out-of-order.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.6, "confidence");
  assert(result.data.plan, "has plan");
  assert(result.data.subjective, "has subjective (HPI)");
  assert(result.data.assessment, "has assessment (impression)");
  assert(result.data.vitals.hr, "extracted HR");
  assert(result.data.vitals.bp, "extracted BP");
});

test("03: Synonym headers", () => {
  const text = loadFixture("03-synonyms.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.6, "confidence");
  assert(result.data.subjective, "HPI mapped to subjective");
  assert(result.data.objective, "Exam mapped to objective");
  assert(result.data.assessment, "Impression mapped to assessment");
  assert(result.data.plan, "Recommendations mapped to plan");
  assertIncludes(result.data.assessment, "heart failure", "assessment content");
});

test("04: All caps text", () => {
  const text = loadFixture("04-all-caps.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.6, "confidence");
  assert(result.data.subjective, "has subjective");
  assert(result.data.vitals.bp, "extracted BP from caps");
  assertIncludes(
    result.data.assessment.toLowerCase(),
    "hypertensive",
    "assessment",
  );
  assertIncludes(result.data.plan.toLowerCase(), "clonidine", "plan");
});

test("05: No plan section", () => {
  const text = loadFixture("05-no-plan.txt");
  const result = parseNote(text);

  assert(result.warnings.length > 0, "has warnings");
  assert(result.data.subjective, "has subjective");
  assert(result.data.assessment, "has assessment");
  assert(result.data.patient.mrn, "extracted MRN");
  assert(result.data.patient.dob, "extracted DOB");
});

test("06: Inline vitals without headers", () => {
  const text = loadFixture("06-inline-vitals.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.5, "confidence");
  assert(result.data.vitals.bp, "extracted inline BP");
  assert(result.data.vitals.hr, "extracted inline HR");
  assertGreater(result.data.vitals.hr, 90, "HR value correct");
  assert(result.data.patient.age === 58, "extracted age");
  assert(result.data.patient.gender === "female", "extracted gender");
});

test("07: Mixed bullets and paragraphs", () => {
  const text = loadFixture("07-bullets-vs-paragraphs.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.6, "confidence");
  assert(result.data.subjective, "has subjective");
  assert(result.data.objective, "has objective");
  assert(result.data.assessment, "has assessment");
  assert(result.data.plan, "has plan");
  assert(result.data.patient.age === 71, "extracted age from bullets");
});

test("08: Unicode quotes and special chars", () => {
  const text = loadFixture("08-unicode-quotes.txt");
  const normalized = normalize(text);

  // Should convert smart quotes to ASCII
  assert(!normalized.includes("\u201C"), "no smart left double quote");
  assert(!normalized.includes("\u201D"), "no smart right double quote");
  assert(!normalized.includes("\u2014"), "no em dash");
  assert(normalized.includes('"'), "has ASCII double quote");

  const result = parseNote(text);
  assertGreater(result.confidence, 0.5, "confidence");
  assert(result.data.vitals.bp, "extracted vitals");
});

test("09: Excessive whitespace", () => {
  const text = loadFixture("09-extra-whitespace.txt");
  const result = parseNote(text);

  assertGreater(result.confidence, 0.6, "confidence");
  assert(result.data.subjective, "has subjective");
  assert(result.data.vitals.hr, "extracted HR");
  assert(result.data.vitals.hr === 142, "HR value correct");
  assertIncludes(result.data.assessment, "atrial fibrillation", "assessment");
});

test("10: Minimal note", () => {
  const text = loadFixture("10-minimal-note.txt");
  const result = parseNote(text);

  assert(result.warnings.length > 0, "has warnings for minimal data");
  assert(result.data.patient.age === 80, "extracted age");
  assert(result.data.patient.gender === "male", "extracted gender");
  assert(result.data.vitals.hr === 38, "extracted HR");
  assert(result.confidence < 0.7, "low confidence for minimal note");
  assert(result.confidence > 0, "non-zero confidence");
});

// === UNIT TESTS ===

test("normalize() collapses whitespace", () => {
  const input = "Hello    world\n\n\n\nNext   paragraph";
  const output = normalize(input);
  assert(!output.includes("    "), "no quad spaces");
  assert(!output.includes("\n\n\n"), "no triple newlines");
});

test("normalize() converts smart quotes", () => {
  const input = "Patient states \u201cI\u2019m fine\u201d";
  const output = normalize(input);
  assert(output.includes('"'), "has ASCII double quote");
  assert(output.includes("'"), "has ASCII single quote");
});

test("extractVitals() handles various formats", () => {
  const text1 = "BP 120/80 HR 72 RR 16 Temp 98.6F SpO2 98%";
  const vitals1 = extractVitals(text1);
  assert(vitals1.bp === "120/80", "BP extracted");
  assert(vitals1.hr === 72, "HR extracted");
  assert(vitals1.rr === 16, "RR extracted");
  assert(vitals1.temp === 98.6, "Temp extracted");
  assert(vitals1.spo2 === 98, "SpO2 extracted");

  const text2 = "Blood pressure: 140/90, heart rate:88";
  const vitals2 = extractVitals(text2);
  assert(vitals2.bp === "140/90", "BP with label");
  assert(vitals2.hr === 88, "HR with label");
});

test("extractMeds() handles delimiters", () => {
  const text = "Aspirin 81mg daily; Metoprolol 25mg BID\nLisinopril 10mg daily";
  const meds = extractMeds(text);
  assert(meds.length === 3, "extracted 3 meds");
  assert(meds.includes("Aspirin 81mg daily"), "has aspirin");
});

test("scoreMatch() finds synonyms", () => {
  const match1 = scoreMatch("HPI");
  assert(match1.canonical === "subjective", "HPI -> subjective");
  assert(match1.score >= 0.9, "high score");

  const match2 = scoreMatch("Assessment/Plan");
  assert(
    match2.canonical === "plan" || match2.canonical === "assessment",
    "A/P maps correctly",
  );

  const match3 = scoreMatch("VITAL SIGNS");
  assert(match3.canonical === "vitals", "caps handled");
});

test("fallbackParse() handles completely unstructured text", () => {
  const text = "Patient has chest pain. BP is 140/90.";
  const result = fallbackParse(text);

  assert(result.data, "returns data");
  assert(result.warnings.length > 0, "has warnings");
  assert(result.confidence >= 0, "has confidence score");
});

// === EDGE CASES ===

test("parseNote() handles empty input", () => {
  const result = parseNote("");
  assert(result.confidence === 0, "zero confidence");
  assert(result.warnings.length > 0, "has warnings");
});

test("parseNote() handles null input", () => {
  const result = parseNote(null);
  assert(result.confidence === 0, "zero confidence");
});

test("parseNote() handles very short input", () => {
  const result = parseNote("Hi");
  assert(result.confidence < 0.3, "low confidence");
  assert(result.warnings.length > 0, "has warnings");
});

// === RESULTS ===

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
