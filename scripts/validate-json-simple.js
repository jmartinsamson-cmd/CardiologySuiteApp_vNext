#!/usr/bin/env node

/**
 * Simple JSON Validation Script for CI/CD
 * Validates all JSON files in the data directory without dynamic imports
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateJsonFiles() {
  let errors = 0;
  let filesChecked = 0;

  function walkDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else if (item.endsWith(".json")) {
        filesChecked++;
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          JSON.parse(content);
          console.log(`✓ Valid: ${path.relative(process.cwd(), fullPath)}`);
        } catch (error) {
          errors++;
          console.error(
            `✗ Invalid JSON: ${path.relative(process.cwd(), fullPath)}`,
          );
          console.error(`  Error: ${error.message}`);
        }
      }
    }
  }

  const dataDir = path.resolve(__dirname, "..", "data");

  if (!fs.existsSync(dataDir)) {
    console.error("Data directory not found:", dataDir);
    process.exit(1);
  }

  console.log("🔍 Validating JSON files in data directory...");
  walkDirectory(dataDir);

  console.log(`\n📊 Summary: ${filesChecked} files checked`);

  if (errors > 0) {
    console.error(`❌ Found ${errors} invalid JSON file(s)`);
    process.exit(1);
  } else {
    console.log("✅ All JSON files are valid");
  }
}

// Run validation
validateJsonFiles();
