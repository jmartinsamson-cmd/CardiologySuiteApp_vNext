/**
 * Smoke Tests for Note Parsing Flow
 * Tests core parsing functions with minimal input
 */

// Simple test framework (no external dependencies)
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertIncludes(text, substring, message) {
  if (!text || !text.includes(substring)) {
    throw new Error(message || `Expected text to include "${substring}"`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || "Expected value to not be null/undefined");
  }
}

function assertType(value, type, message) {
  if (typeof value !== type) {
    throw new Error(message || `Expected type ${type}, got ${typeof value}`);
  }
}

async function runTests() {
  console.log("🧪 Running Smoke Tests for Note Parsing\n");

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ FAIL: ${test.name}`);
      console.error(`   ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  return failed === 0;
}

// ============================================================================
// TEST DATA
// ============================================================================

const MINIMAL_CLINICAL_NOTE = `
Chief Complaint: Chest pain

History of Present Illness:
Patient is a 65-year-old male with a history of hypertension who presents with chest pain.
Pain started 2 hours ago, described as pressure-like, radiating to left arm.

Vitals:
BP: 150/90
HR: 88
RR: 16
SpO2: 98% on RA

Assessment:
1. Chest pain, likely angina
2. Hypertension

Plan:
1. EKG
2. Troponin
3. Start aspirin 325mg
4. Cardiology consult
`;

const MINIMAL_HPI = `
65-year-old male with hypertension presents with chest pain for 2 hours.
Pain is pressure-like, radiating to left arm.
`;

// ============================================================================
// TESTS
// ============================================================================

test("Parser functions are available", () => {
  assert(
    typeof window.parseClinicalNoteFull === "function" ||
      typeof window.parseClinicalNote === "function",
    "At least one parser function must be available",
  );
});

test("parseClinicalNoteFull returns valid structure", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const result = window.parseClinicalNoteFull(MINIMAL_CLINICAL_NOTE);

  assertNotNull(result, "Parser should return a value");
  assertType(result, "object", "Parser should return an object");
  assert(result.sections, "Result should have sections property");
  assert(result.fullText, "Result should have fullText property");
});

test("parseClinicalNote returns valid structure", () => {
  if (typeof window.parseClinicalNote !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNote not available");
    return;
  }

  const result = window.parseClinicalNote(MINIMAL_CLINICAL_NOTE);

  assertNotNull(result, "Parser should return a value");
  assertType(result, "object", "Parser should return an object");
});

test("Parsed data contains expected sections", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const result = window.parseClinicalNoteFull(MINIMAL_CLINICAL_NOTE);

  assert(result.sections, "Should have sections object");

  // Check for common sections
  const sections = result.sections;
  const hasCCOrHPI =
    sections["Chief Complaint"] ||
    sections["HPI"] ||
    sections["History of Present Illness"];
  assert(hasCCOrHPI, "Should parse Chief Complaint or HPI");
});

test("TemplateRenderer is initialized", () => {
  assertNotNull(
    window.templateRenderer,
    "TemplateRenderer should be initialized",
  );
  assertType(
    window.templateRenderer,
    "object",
    "TemplateRenderer should be an object",
  );
});

test("TemplateRenderer can process HPI", () => {
  assertNotNull(window.templateRenderer, "TemplateRenderer must be available");

  const renderer = window.templateRenderer;
  assert(
    typeof renderer.generateFullNoteFromHPI === "function",
    "generateFullNoteFromHPI should exist",
  );

  const result = renderer.generateFullNoteFromHPI(MINIMAL_HPI);

  assertNotNull(result, "Should return processed data");
  assertType(result, "object", "Should return an object");
});

test("TemplateRenderer can normalize sections", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const parsed = window.parseClinicalNoteFull(MINIMAL_CLINICAL_NOTE);
  const renderer = window.templateRenderer;

  const { normalized, unmapped } = renderer.normalizeSections(parsed);

  assertNotNull(normalized, "Should return normalized sections");
  assertType(normalized, "object", "Normalized should be an object");
  assertType(unmapped, "object", "Unmapped should be an object");
});

test("TemplateRenderer can render CIS template", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const parsed = window.parseClinicalNoteFull(MINIMAL_CLINICAL_NOTE);
  const renderer = window.templateRenderer;

  const { normalized } = renderer.normalizeSections(parsed);
  renderer.normalizedSections = normalized;
  renderer.currentTemplate = "cis";

  const output = renderer.renderTemplate("cis");

  assertNotNull(output, "Should return rendered output");
  assertType(output, "string", "Output should be a string");
  assert(output.length > 0, "Output should not be empty");
});

test("Rendered output includes key sections", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const parsed = window.parseClinicalNoteFull(MINIMAL_CLINICAL_NOTE);
  const renderer = window.templateRenderer;

  const { normalized } = renderer.normalizeSections(parsed);
  renderer.normalizedSections = normalized;
  renderer.parsedData = parsed;
  renderer.currentTemplate = "cis";

  const output = renderer.renderTemplate("cis");

  // Check for expected content markers
  assertIncludes(
    output,
    "History of Present Illness",
    "Should include HPI section label",
  );
  assertIncludes(output, "Assessment", "Should include Assessment section");
  assertIncludes(output, "Plan", "Should include Plan section");
});

test("Full end-to-end processing", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  // Simulate full flow
  const text = MINIMAL_CLINICAL_NOTE;
  const parsed = window.parseClinicalNoteFull(text);
  const renderer = window.templateRenderer;

  renderer.parsedData = parsed;
  const { normalized, unmapped } = renderer.normalizeSections(parsed);
  renderer.normalizedSections = normalized;
  renderer.unmappedContent = unmapped;

  const output = renderer.renderTemplate();

  assertNotNull(output, "Should produce output");
  assertType(output, "string", "Output should be string");
  assert(output.length > 100, "Output should have substantial content");

  // Verify key patient info would be included
  assertIncludes(output, "Plan:", "Should include Plan section");
});

test("Error handling: null input", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  try {
    window.parseClinicalNoteFull(null);
    // If no error thrown, that's okay - just check it doesn't crash
    console.log("   ℹ️  Parser accepts null without throwing");
  } catch (error) {
    // Error is acceptable behavior
    console.log("   ℹ️  Parser throws error for null input (expected)");
  }
});

test("Error handling: empty string", () => {
  if (typeof window.parseClinicalNoteFull !== "function") {
    console.log("   ⏭️  SKIP: parseClinicalNoteFull not available");
    return;
  }

  const result = window.parseClinicalNoteFull("");
  assertNotNull(result, "Should handle empty string gracefully");
});

// ============================================================================
// TEST RUNNER
// ============================================================================

if (typeof window !== "undefined") {
  // Browser environment
  window.runSmokeTests = runTests;
  console.log("💡 Smoke tests loaded. Run with: window.runSmokeTests()");
} else if (typeof module !== "undefined") {
  // Node.js environment
  module.exports = { runTests };
}
