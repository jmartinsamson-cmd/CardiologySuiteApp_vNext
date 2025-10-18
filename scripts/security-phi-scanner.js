#!/usr/bin/env node

/**
 * PHI/PII Scanner for Medical Applications
 * Scans code and comments for potential patient health information
 */

import fs from "fs";
import path from "path";

// Common PHI/PII patterns to detect
const PHI_PATTERNS = [
  // Names (common patterns)
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // FirstName LastName

  // Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{9}\b/g,

  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,

  // Email addresses (potential personal emails)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Medical Record Numbers (common formats)
  /\bMRN:?\s*\d+\b/gi,
  /\b[A-Z]{2,3}\d{6,10}\b/g,

  // Dates (potential DOB)
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  /\b\d{4}-\d{2}-\d{2}\b/g,

  // Credit card patterns
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // Common PHI field names in comments/variables
  /\b(patient_name|patient_ssn|social_security|date_of_birth|dob|phone_number|address|mrn|medical_record)\b/gi,
];

// Files to scan
const SCAN_EXTENSIONS = [".js", ".ts", ".jsx", ".tsx", ".json", ".md"];
const EXCLUDE_DIRS = ["node_modules", ".git", "dist", "build"];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];

  PHI_PATTERNS.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;

      // Skip if it's in a comment explaining PHI protection
      if (
        content
          .substring(Math.max(0, match.index - 50), match.index + 50)
          .toLowerCase()
          .includes("phi") ||
        content
          .substring(Math.max(0, match.index - 50), match.index + 50)
          .toLowerCase()
          .includes("example")
      ) {
        continue;
      }

      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: `Pattern ${index + 1}`,
        match: match[0],
        context: content.substring(
          Math.max(0, match.index - 30),
          match.index + 30,
        ),
      });
    }
  });

  return violations;
}

function scanDirectory(dirPath) {
  const violations = [];

  function traverse(currentPath) {
    const stats = fs.statSync(currentPath);

    if (stats.isDirectory()) {
      const dirName = path.basename(currentPath);
      if (EXCLUDE_DIRS.includes(dirName)) {
        return;
      }

      const items = fs.readdirSync(currentPath);
      items.forEach((item) => {
        traverse(path.join(currentPath, item));
      });
    } else if (stats.isFile()) {
      const ext = path.extname(currentPath);
      if (SCAN_EXTENSIONS.includes(ext)) {
        violations.push(...scanFile(currentPath));
      }
    }
  }

  traverse(dirPath);
  return violations;
}

function main() {
  console.log("🔍 Scanning for potential PHI/PII data...");

  const startDir = process.cwd();
  const violations = scanDirectory(startDir);

  if (violations.length > 0) {
    console.error(
      `❌ Found ${violations.length} potential PHI/PII violations:`,
    );

    violations.forEach((violation) => {
      console.error(`\n📄 File: ${violation.file}`);
      console.error(`📍 Line: ${violation.line}`);
      console.error(`🔍 Pattern: ${violation.pattern}`);
      console.error(`📝 Match: ${violation.match}`);
      console.error(`📋 Context: ...${violation.context}...`);
    });

    console.error(
      "\n⚠️  Please review these potential PHI/PII exposures and remove any actual patient data.",
    );
    process.exit(1);
  } else {
    console.log("✅ No PHI/PII violations detected");
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
