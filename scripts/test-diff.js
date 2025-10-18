#!/usr/bin/env node
/**
 * Parser Diff Utility
 * Compare parser output to expected output for a specific fixture
 *
 * Usage:
 *   npm run test:diff -- note-001
 *   node scripts/test-diff.js note-001 --verbose
 */

import { parseNote } from "../src/parsers/smartParser.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function color(code, text) {
  return `${c[code]}${text}${c.reset}`;
}

// Parse args
const args = process.argv.slice(2);
const noteId = args.find((a) => !a.startsWith("--"));
const verbose = args.includes("--verbose");

if (!noteId) {
  console.error(color("red", "Error: Please specify a note ID"));
  console.log("\nUsage: npm run test:diff -- note-001");
  process.exit(1);
}

// Load fixture
const fixturePath = path.join(
  __dirname,
  "..",
  "tests",
  "fixtures",
  "real",
  `${noteId}.json`,
);

if (!fs.existsSync(fixturePath)) {
  console.error(color("red", `Error: Fixture not found: ${fixturePath}`));
  process.exit(1);
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

console.log(color("bright", `🔍 Diff Report: ${fixture.id}`));
console.log(color("cyan", `Description: ${fixture.description}\n`));

// Parse note
const result = parseNote(fixture.input);
const { data, confidence, warnings } = result;

console.log(color("cyan", `Parser Confidence: ${confidence.toFixed(2)}`));
if (warnings.length > 0) {
  console.log(color("yellow", `Warnings: ${warnings.join(", ")}\n`));
} else {
  console.log(color("green", "No warnings\n"));
}

/**
 * Compare two values and return status icon
 */
function compareValues(actual, expected) {
  // Handle null/undefined
  if (actual === expected) {
    return { status: "✅", message: "exact match", match: true };
  }

  if (actual == null && expected == null) {
    return { status: "✅", message: "both null/undefined", match: true };
  }

  if (actual == null || expected == null) {
    return { status: "❌", message: `null mismatch`, match: false };
  }

  // Handle arrays
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      return {
        status: "❌",
        message: "type mismatch (expected array)",
        match: false,
      };
    }

    const missing = expected.filter((item) => !actual.includes(item));
    const extra = actual.filter((item) => !expected.includes(item));

    if (missing.length === 0 && extra.length === 0) {
      return { status: "✅", message: "arrays match", match: true };
    }

    if (missing.length === 0) {
      return {
        status: "⚠️ ",
        message: `has extra items: ${extra.join(", ")}`,
        match: true,
      };
    }

    return {
      status: "❌",
      message: `missing: ${missing.join(", ")}`,
      match: false,
    };
  }

  // Handle objects (recurse)
  if (typeof expected === "object" && typeof actual === "object") {
    return { status: "🔍", message: "nested object", match: true };
  }

  // Handle primitives
  if (typeof actual === "number" && typeof expected === "number") {
    const diff = Math.abs(actual - expected);
    const percentDiff = (diff / expected) * 100;

    if (diff === 0) {
      return { status: "✅", message: "exact match", match: true };
    } else if (percentDiff < 5) {
      return {
        status: "⚠️ ",
        message: `close (${actual} vs ${expected})`,
        match: true,
      };
    } else {
      return {
        status: "❌",
        message: `mismatch (${actual} vs ${expected})`,
        match: false,
      };
    }
  }

  // String comparison
  if (typeof actual === "string" && typeof expected === "string") {
    if (actual === expected) {
      return { status: "✅", message: "exact match", match: true };
    }

    if (actual.toLowerCase() === expected.toLowerCase()) {
      return { status: "⚠️ ", message: "case mismatch", match: true };
    }

    if (actual.includes(expected) || expected.includes(actual)) {
      return { status: "⚠️ ", message: "partial match", match: true };
    }

    return { status: "❌", message: "string mismatch", match: false };
  }

  return { status: "❌", message: "value mismatch", match: false };
}

/**
 * Recursively diff objects
 */
function diffObject(actual, expected, path = "", indent = 0) {
  const prefix = "  ".repeat(indent);

  for (const key of Object.keys(expected)) {
    const currentPath = path ? `${path}.${key}` : key;
    const actualValue = actual?.[key];
    const expectedValue = expected[key];

    if (
      typeof expectedValue === "object" &&
      !Array.isArray(expectedValue) &&
      expectedValue !== null
    ) {
      // Nested object
      console.log(`${prefix}${color("cyan", currentPath)}:`);
      diffObject(actualValue || {}, expectedValue, currentPath, indent + 1);
    } else {
      // Leaf value
      const comparison = compareValues(actualValue, expectedValue, currentPath);

      let statusColor = "green";
      if (comparison.status === "❌") statusColor = "red";
      if (comparison.status === "⚠️ ") statusColor = "yellow";

      console.log(
        `${prefix}${comparison.status} ${color("cyan", currentPath)}: ${color(statusColor, comparison.message)}`,
      );

      if (verbose && !comparison.match) {
        console.log(
          `${prefix}  ${color("red", "- expected:")} ${JSON.stringify(expectedValue)}`,
        );
        console.log(
          `${prefix}  ${color("green", "+ actual:  ")} ${JSON.stringify(actualValue)}`,
        );
      }
    }
  }
}

// Main comparison
console.log(color("bright", "📋 Field-by-Field Comparison:\n"));
diffObject(data, fixture.expected);

// mustHave checks
if (fixture.mustHave) {
  console.log("\n" + color("bright", "✓ Must-Have Checks:"));

  for (const [path, value] of Object.entries(fixture.mustHave)) {
    const actualValue = path.split(".").reduce((obj, key) => obj?.[key], data);
    const comparison = compareValues(actualValue, value, path);

    let statusColor = "green";
    if (comparison.status === "❌") statusColor = "red";

    console.log(
      `  ${comparison.status} ${color("cyan", path)}: ${color(statusColor, comparison.message)}`,
    );
  }
}

// shouldNotHave checks
if (fixture.shouldNotHave) {
  console.log("\n" + color("bright", "✗ Should-Not-Have Checks:"));

  for (const [path, forbiddenValues] of Object.entries(fixture.shouldNotHave)) {
    const actualValue = path.split(".").reduce((obj, key) => obj?.[key], data);

    if (Array.isArray(forbiddenValues)) {
      const found = forbiddenValues.filter((item) =>
        actualValue?.includes(item),
      );

      if (found.length === 0) {
        console.log(
          `  ${color("green", "✅")} ${color("cyan", path)}: ${color("green", "no forbidden values found")}`,
        );
      } else {
        console.log(
          `  ${color("red", "❌")} ${color("cyan", path)}: ${color("red", `found forbidden: ${found.join(", ")}`)}`,
        );
      }
    } else {
      if (actualValue !== forbiddenValues) {
        console.log(
          `  ${color("green", "✅")} ${color("cyan", path)}: ${color("green", "not equal to forbidden value")}`,
        );
      } else {
        console.log(
          `  ${color("red", "❌")} ${color("cyan", path)}: ${color("red", "equals forbidden value")}`,
        );
      }
    }
  }
}

// Show raw output if verbose
if (verbose) {
  console.log("\n" + color("bright", "🔍 Raw Parser Output:"));
  console.log(JSON.stringify(data, null, 2));
}

console.log("\n" + color("cyan", "Tip: Use --verbose flag for detailed diffs"));
