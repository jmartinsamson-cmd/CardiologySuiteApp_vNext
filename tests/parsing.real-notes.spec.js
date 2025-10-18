/**
 * Real Clinical Notes Test Suite
 * Tests parser against actual de-identified clinical notes
 *
 * Usage:
 *   npm run test:real-notes                    # Run all real note tests
 *   npm run test:real-notes -- --file=note-001 # Test single note
 *   npm run test:real-notes -- --verbose       # Show detailed diff
 */

import { parseNote } from "../src/parsers/smartParser.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line args
const args = process.argv.slice(2);
const singleFile = args.find((a) => a.startsWith("--file="))?.split("=")[1];
const verbose = args.includes("--verbose");
const statsOnly = args.includes("--stats");

// Test results tracking
let passed = 0;
let failed = 0;
const failures = [];

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Load all fixture files from tests/fixtures/real/
 */
function loadRealFixtures() {
  const fixturesDir = path.join(__dirname, "fixtures", "real");

  if (!fs.existsSync(fixturesDir)) {
    console.error(
      colorize("red", `❌ Fixtures directory not found: ${fixturesDir}`),
    );
    console.log(
      colorize("yellow", "\nCreate it with: mkdir tests/fixtures/real"),
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".json") && f !== "TEMPLATE.json")
    .filter((f) => !singleFile || f.includes(singleFile));

  if (files.length === 0) {
    console.error(
      colorize("yellow", "⚠️  No fixture files found in tests/fixtures/real/"),
    );
    console.log(colorize("cyan", "\nAdd fixtures by copying TEMPLATE.json:"));
    console.log(
      "  cp tests/fixtures/real/TEMPLATE.json tests/fixtures/real/note-001.json",
    );
    process.exit(0);
  }

  return files.map((filename) => {
    const filepath = path.join(fixturesDir, filename);
    const content = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(content);
  });
}

/**
 * Deep equality check with detailed diff
 */
function deepEqual(actual, expected, path = "") {
  const diffs = [];

  // Handle null/undefined
  if (actual === expected) return { equal: true, diffs: [] };
  if (actual == null || expected == null) {
    diffs.push({ path, expected, actual, type: "null-mismatch" });
    return { equal: false, diffs };
  }

  // Handle arrays
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      diffs.push({ path, expected, actual, type: "type-mismatch" });
      return { equal: false, diffs };
    }

    // Check if all expected items are present (allows extra items)
    for (const item of expected) {
      if (!actual.includes(item)) {
        diffs.push({
          path,
          expected: item,
          actual: actual,
          type: "missing-array-item",
        });
      }
    }

    return { equal: diffs.length === 0, diffs };
  }

  // Handle objects
  if (typeof expected === "object" && typeof actual === "object") {
    for (const key of Object.keys(expected)) {
      const newPath = path ? `${path}.${key}` : key;
      const result = deepEqual(actual[key], expected[key], newPath);
      diffs.push(...result.diffs);
    }
    return { equal: diffs.length === 0, diffs };
  }

  // Handle primitives
  if (actual !== expected) {
    diffs.push({ path, expected, actual, type: "value-mismatch" });
    return { equal: false, diffs };
  }

  return { equal: true, diffs: [] };
}

/**
 * Format diff output for console
 */
function formatDiff(diffs) {
  if (diffs.length === 0) return "";

  let output = "\n  " + colorize("yellow", "DIFF:");

  for (const diff of diffs) {
    output += `\n  ${colorize("cyan", diff.path)}:`;

    switch (diff.type) {
      case "missing-array-item":
        output += `\n    ${colorize("red", "- expected:")} "${diff.expected}"`;
        output += `\n    ${colorize("green", "+ actual:")} ${JSON.stringify(diff.actual)}`;
        break;

      case "value-mismatch":
        output += `\n    ${colorize("red", "- expected:")} ${JSON.stringify(diff.expected)}`;
        output += `\n    ${colorize("green", "+ actual:")} ${JSON.stringify(diff.actual)}`;
        break;

      case "type-mismatch":
        output += `\n    ${colorize("red", "- expected type:")} ${typeof diff.expected}`;
        output += `\n    ${colorize("green", "+ actual type:")} ${typeof diff.actual}`;
        break;

      case "null-mismatch":
        output += `\n    ${colorize("red", "- expected:")} ${diff.expected}`;
        output += `\n    ${colorize("green", "+ actual:")} ${diff.actual}`;
        break;
    }
  }

  return output;
}

/**
 * Check "mustHave" assertions
 */
function checkMustHave(data, mustHave) {
  const errors = [];

  for (const [path, expectedValue] of Object.entries(mustHave)) {
    const actualValue = getNestedValue(data, path);

    if (Array.isArray(expectedValue)) {
      // Check if all expected items are present
      for (const item of expectedValue) {
        if (!actualValue?.includes(item)) {
          errors.push(`Missing required value "${item}" in ${path}`);
        }
      }
    } else if (actualValue !== expectedValue) {
      errors.push(
        `Expected ${path} to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }

  return errors;
}

/**
 * Check "shouldNotHave" assertions
 */
function checkShouldNotHave(data, shouldNotHave) {
  const errors = [];

  for (const [path, forbiddenValues] of Object.entries(shouldNotHave)) {
    const actualValue = getNestedValue(data, path);

    if (Array.isArray(forbiddenValues)) {
      for (const item of forbiddenValues) {
        if (actualValue?.includes(item)) {
          errors.push(`Found forbidden value "${item}" in ${path}`);
        }
      }
    } else if (actualValue === forbiddenValues) {
      errors.push(
        `Found forbidden value ${JSON.stringify(forbiddenValues)} in ${path}`,
      );
    }
  }

  return errors;
}

/**
 * Get nested object value by path string (e.g., "vitals.bp")
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * Run test for a single fixture
 */
function testFixture(fixture) {
  // Skip if requested
  if (fixture.skip) {
    console.log(
      colorize(
        "yellow",
        `⏭️  ${fixture.id}: ${fixture.description} (skipped: ${fixture.skipReason || "no reason given"})`,
      ),
    );
    return;
  }

  try {
    // Parse the note
    const result = parseNote(fixture.input);
    const { data, confidence, warnings } = result;

    // Track errors
    const errors = [];

    // Check mustHave assertions
    if (fixture.mustHave) {
      errors.push(...checkMustHave(data, fixture.mustHave));
    }

    // Check shouldNotHave assertions
    if (fixture.shouldNotHave) {
      errors.push(...checkShouldNotHave(data, fixture.shouldNotHave));
    }

    // Check expected output (deep comparison)
    const { equal, diffs } = deepEqual(data, fixture.expected);

    // Determine if test passed
    const testPassed = errors.length === 0 && equal;

    if (testPassed) {
      console.log(
        colorize("green", `✅ ${fixture.id}: ${fixture.description}`),
      );
      if (verbose) {
        console.log(
          colorize("cyan", `   Confidence: ${confidence.toFixed(2)}`),
        );
        console.log(colorize("cyan", `   Warnings: ${warnings.length}`));
      }
      passed++;
    } else {
      console.log(colorize("red", `❌ ${fixture.id}: ${fixture.description}`));

      // Show errors
      for (const error of errors) {
        console.log(colorize("red", `   ${error}`));
      }

      // Show diff
      if (verbose && diffs.length > 0) {
        console.log(formatDiff(diffs));
      }

      // Show warnings
      if (warnings.length > 0) {
        console.log(
          colorize("yellow", `   Parser warnings: ${warnings.join(", ")}`),
        );
      }

      console.log(
        colorize("cyan", `   Confidence: ${confidence.toFixed(2)}\n`),
      );

      failed++;
      failures.push({
        id: fixture.id,
        description: fixture.description,
        errors,
        diffs,
        confidence,
      });
    }
  } catch (error) {
    console.log(colorize("red", `❌ ${fixture.id}: ${fixture.description}`));
    console.log(colorize("red", `   Error: ${error.message}\n`));
    failed++;
    failures.push({
      id: fixture.id,
      description: fixture.description,
      errors: [error.message],
      diffs: [],
    });
  }
}

/**
 * Main test runner
 */
function runTests() {
  console.log(
    colorize("bright", "🧪 Running Real Clinical Notes Parser Tests\n"),
  );

  const fixtures = loadRealFixtures();
  console.log(colorize("cyan", `Found ${fixtures.length} fixture(s)\n`));

  for (const fixture of fixtures) {
    testFixture(fixture);
  }

  // Summary
  console.log("\n" + colorize("bright", "📊 Test Results:"));
  console.log(`   ${colorize("green", `✅ Passed: ${passed}`)}`);
  console.log(`   ${colorize("red", `❌ Failed: ${failed}`)}`);
  console.log(
    `   ${colorize("cyan", `📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)}`,
  );

  // Detailed failure summary
  if (failures.length > 0 && !statsOnly) {
    console.log("\n" + colorize("yellow", "🔍 Failed Tests Summary:"));
    for (const failure of failures) {
      console.log(`\n  ${colorize("red", failure.id)}: ${failure.description}`);
      console.log(`    Confidence: ${failure.confidence.toFixed(2)}`);
      if (failure.errors.length > 0) {
        console.log(`    Errors:`);
        for (const error of failure.errors) {
          console.log(`      - ${error}`);
        }
      }
    }
  }

  // Exit code
  if (failed > 0) {
    console.log(
      colorize(
        "red",
        "\n❌ Some tests failed. Fix parser or update expected output.",
      ),
    );
    process.exit(1);
  } else {
    console.log(colorize("green", "\n✅ All tests passed!"));
    process.exit(0);
  }
}

// Run tests
runTests();
