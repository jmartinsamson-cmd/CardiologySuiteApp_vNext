#!/usr/bin/env node
/* eslint-disable no-unused-vars */

/**
 * Interactive Snapshot Update Script
 *
 * This script helps safely update visual test snapshots by:
 * 1. Running visual tests to detect changes
 * 2. Showing diffs for any failed snapshots
 * 3. Requiring explicit user approval before updating
 * 4. Providing a summary of what changed
 */

import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

console.log("🔍 Running visual regression tests...\n");

try {
  // Run visual tests without updating snapshots
  execSync("npm run test:visual", { stdio: "inherit" });

  console.log("\n✅ All visual tests passed! No snapshot updates needed.\n");
  rl.close();
  process.exit(0);
} catch (error) {
  console.log("\n⚠️  Visual test failures detected!\n");

  // Check if test-results directory exists
  const testResultsDir = join(process.cwd(), "test-results");

  if (!existsSync(testResultsDir)) {
    console.log("❌ No test results found. Tests may have failed to run.\n");
    rl.close();
    process.exit(1);
  }

  // Find all diff images
  const diffs = [];

  function findDiffs(dir) {
    const files = readdirSync(dir);

    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        findDiffs(fullPath);
      } else if (file.endsWith("-diff.png") || file.includes("diff")) {
        diffs.push(relative(process.cwd(), fullPath));
      }
    }
  }

  findDiffs(testResultsDir);

  if (diffs.length === 0) {
    console.log(
      "ℹ️  No visual diffs found. Tests may have failed for other reasons.\n",
    );
    console.log(
      'Run "npm run test:visual:report" to see detailed test results.\n',
    );
    rl.close();
    process.exit(1);
  }

  console.log("📊 Visual differences detected in the following snapshots:\n");
  diffs.forEach((diff, index) => {
    console.log(`  ${index + 1}. ${diff}`);
  });

  console.log("\n📸 Snapshot changes summary:");
  console.log(`  - ${diffs.length} snapshot(s) have visual differences`);
  console.log(`  - Diff images saved in: ${testResultsDir}\n`);

  console.log("To review diffs visually:");
  console.log("  1. Run: npm run test:visual:report");
  console.log("  2. This will open a browser with side-by-side comparisons\n");

  (async () => {
    const openReport = await ask(
      "❓ Would you like to open the visual report now? (y/n): ",
    );

    if (
      openReport.toLowerCase() === "y" ||
      openReport.toLowerCase() === "yes"
    ) {
      console.log("\n🌐 Opening visual test report...\n");
      try {
        execSync("npm run test:visual:report", { stdio: "inherit" });
      } catch (e) {
        console.log("ℹ️  Report closed or not available.\n");
      }
    }

    console.log(
      "\n⚠️  IMPORTANT: Review all visual changes carefully before updating!\n",
    );
    console.log("Changes could indicate:");
    console.log("  ✓ Intentional UI improvements");
    console.log("  ✗ Unintended regressions");
    console.log("  ✗ Browser/OS rendering differences");
    console.log("  ✗ Timing or animation issues\n");

    const answer = await ask(
      "❓ Do you want to UPDATE all snapshots? (yes/no): ",
    );

    if (answer.toLowerCase() === "yes") {
      console.log("\n🔄 Updating snapshots...\n");

      try {
        execSync("npm run test:visual:update", { stdio: "inherit" });
        console.log("\n✅ Snapshots updated successfully!\n");
        console.log("📝 Next steps:");
        console.log("  1. Review the updated snapshots in tests/snapshots/");
        console.log("  2. Commit the changes: git add tests/snapshots/");
        console.log(
          "  3. Include in your commit message why snapshots changed\n",
        );
      } catch (updateError) {
        console.log("\n❌ Failed to update snapshots.\n");
        rl.close();
        process.exit(1);
      }
    } else {
      console.log("\n❌ Snapshot update cancelled. No changes made.\n");
      console.log("To update later, run: npm run test:visual:update\n");
    }

    rl.close();
  })();
}
