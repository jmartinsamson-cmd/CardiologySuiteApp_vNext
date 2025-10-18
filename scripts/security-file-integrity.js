#!/usr/bin/env node

/**
 * Security File Integrity Checker
 * Monitors critical files for unauthorized changes
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const CRITICAL_FILES = [
  "package.json",
  "package-lock.json",
  "eslint.config.js",
  "tsconfig.json",
  "src/core/app.js",
  "data/cardiac_procedures.json",
  "data/enhanced/",
  "data/guidelines/",
  ".github/workflows/security-checks.yml",
];

const CHECKSUM_FILE = ".security-checksums.json";

function calculateChecksum(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    // For directories, calculate checksum of all files recursively
    const files = fs.readdirSync(filePath, { recursive: true });
    const hashes = files
      .filter((file) => fs.statSync(path.join(filePath, file)).isFile())
      .map((file) => calculateChecksum(path.join(filePath, file)))
      .sort();
    return crypto.createHash("sha256").update(hashes.join("")).digest("hex");
  }

  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

function loadStoredChecksums() {
  if (!fs.existsSync(CHECKSUM_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(CHECKSUM_FILE, "utf8"));
}

function saveChecksums(checksums) {
  fs.writeFileSync(CHECKSUM_FILE, JSON.stringify(checksums, null, 2));
}

function checkIntegrity() {
  console.log("🔍 Checking file integrity...");

  const storedChecksums = loadStoredChecksums();
  const currentChecksums = {};
  let hasChanges = false;

  for (const file of CRITICAL_FILES) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  Critical file missing: ${file}`);
      continue;
    }

    const currentChecksum = calculateChecksum(file);
    currentChecksums[file] = currentChecksum;

    if (storedChecksums[file] && storedChecksums[file] !== currentChecksum) {
      console.warn(`🚨 File modified: ${file}`);
      hasChanges = true;
    } else if (!storedChecksums[file]) {
      console.log(`➕ New file tracked: ${file}`);
    }
  }

  if (hasChanges) {
    console.error("❌ File integrity check failed!");
    process.exit(1);
  } else {
    console.log("✅ File integrity check passed");
  }
}

function updateChecksums() {
  console.log("🔄 Updating security checksums...");

  const checksums = {};

  for (const file of CRITICAL_FILES) {
    if (fs.existsSync(file)) {
      checksums[file] = calculateChecksum(file);
      console.log(`📝 Updated checksum for: ${file}`);
    }
  }

  saveChecksums(checksums);
  console.log("✅ Security checksums updated");
}

// CLI handling
const command = process.argv[2];

switch (command) {
  case "check":
    checkIntegrity();
    break;
  case "update":
    updateChecksums();
    break;
  default:
    console.log("Usage: node security-file-integrity.js [check|update]");
    console.log("  check  - Verify file integrity against stored checksums");
    console.log("  update - Update stored checksums for critical files");
    process.exit(1);
}
