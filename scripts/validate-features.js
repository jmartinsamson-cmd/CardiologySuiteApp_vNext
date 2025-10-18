#!/usr/bin/env node

/**
 * Validate config/features.json is valid JSON
 * Used in CI to catch configuration errors before deployment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEATURES_PATH = path.join(__dirname, "..", "config", "features.json");

function validateFeatures() {
  console.log("🔍 Validating config/features.json...");

  // Check file exists
  if (!fs.existsSync(FEATURES_PATH)) {
    console.error("❌ config/features.json not found");
    console.error(`   Expected at: ${FEATURES_PATH}`);
    process.exit(1);
  }

  // Read file
  let content;
  try {
    content = fs.readFileSync(FEATURES_PATH, "utf8");
  } catch (error) {
    console.error("❌ Failed to read config/features.json");
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }

  // Parse JSON
  let features;
  try {
    features = JSON.parse(content);
  } catch (error) {
    console.error("❌ config/features.json is not valid JSON");
    console.error(`   Error: ${error.message}`);
    console.error(
      `   Line: ${error.message.match(/position (\d+)/)?.[1] || "unknown"}`,
    );
    console.error("\n   Hint: Check for:");
    console.error("   - Missing commas between properties");
    console.error("   - Trailing commas (not allowed in JSON)");
    console.error("   - Comments (not allowed in JSON)");
    console.error("   - Unquoted keys or values");
    process.exit(1);
  }

  // Validate structure
  if (
    typeof features !== "object" ||
    features === null ||
    Array.isArray(features)
  ) {
    console.error("❌ config/features.json must be a JSON object");
    console.error(`   Got: ${typeof features}`);
    process.exit(1);
  }

  // Validate known flags
  const knownFlags = ["sidebar_sanitize", "meds_feature"];
  const flagKeys = Object.keys(features);

  if (flagKeys.length === 0) {
    console.warn("⚠️  config/features.json is empty (no flags defined)");
  }

  // Check for unknown flags
  const unknownFlags = flagKeys.filter((key) => !knownFlags.includes(key));
  if (unknownFlags.length > 0) {
    console.warn("⚠️  Unknown feature flags detected:");
    unknownFlags.forEach((flag) => {
      console.warn(`   - ${flag}`);
    });
    console.warn("   Known flags:", knownFlags.join(", "));
  }

  // Validate flag values are boolean
  let hasInvalidValues = false;
  flagKeys.forEach((key) => {
    if (typeof features[key] !== "boolean") {
      console.error(`❌ Flag "${key}" must be a boolean (true/false)`);
      console.error(
        `   Got: ${typeof features[key]} = ${JSON.stringify(features[key])}`,
      );
      hasInvalidValues = true;
    }
  });

  if (hasInvalidValues) {
    process.exit(1);
  }

  // Success
  console.log("✅ config/features.json is valid");
  console.log(`   Flags defined: ${flagKeys.length}`);
  flagKeys.forEach((key) => {
    const status = features[key] ? "✅ enabled" : "❌ disabled";
    console.log(`   - ${key}: ${status}`);
  });

  process.exit(0);
}

// Run validation
validateFeatures();
