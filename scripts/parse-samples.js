#!/usr/bin/env node

/**
 * Run parser against all sample fixtures
 * Usage: node scripts/parse-samples.js
 */

import { parseNote } from "../src/parsers/smartParser.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesDir = path.join(__dirname, "..", "tests", "fixtures");

if (!fs.existsSync(fixturesDir)) {
  console.error(`Fixtures directory not found: ${fixturesDir}`);
  process.exit(1);
}

const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((f) => f.endsWith(".txt"))
  .sort();

console.log(`🧪 Parsing ${fixtures.length} sample fixtures\n`);
console.log(`${"=".repeat(80)}\n`);

const results = [];

for (const fixture of fixtures) {
  const filePath = path.join(fixturesDir, fixture);
  const text = fs.readFileSync(filePath, "utf-8");
  const result = parseNote(text);

  const status =
    result.confidence >= 0.5 && (result.data.assessment || result.data.plan)
      ? "✅"
      : "❌";

  console.log(`${status} ${fixture}`);
  console.log(
    `   Confidence: ${(result.confidence * 100).toFixed(1)}% | Sections: ${Object.keys(result.raw.sections).length} | Warnings: ${result.warnings.length}`,
  );

  if (result.warnings.length > 0 && result.warnings.length <= 3) {
    result.warnings.forEach((w) => console.log(`      ⚠️  ${w}`));
  } else if (result.warnings.length > 3) {
    console.log(`      ⚠️  ${result.warnings.length} warnings (truncated)`);
  }

  console.log();

  results.push({
    fixture,
    confidence: result.confidence,
    warnings: result.warnings.length,
    passed:
      result.confidence >= 0.5 && (result.data.assessment || result.data.plan),
  });
}

// Summary
console.log(`${"=".repeat(80)}\n`);

const passed = results.filter((r) => r.passed).length;
const failed = results.length - passed;
const avgConfidence =
  results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

console.log(`📊 Summary:`);
console.log(`   Total: ${results.length}`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log(`\n❌ ${failed} fixture(s) failed`);
  process.exit(1);
} else {
  console.log(`\n✅ All fixtures passed`);
  process.exit(0);
}
