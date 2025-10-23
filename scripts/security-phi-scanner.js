#!/usr/bin/env node

/**
 * PHI/PII Scanner for Medical Applications
 * Scans code and comments for potential patient health information
 */

import fs from "node:fs";
import path from "node:path";

// Common PHI/PII patterns to detect
// NOTE: Patterns are intentionally narrow to reduce false positives
const PHI_PATTERNS = [
  // Social Security Numbers (high confidence PHI)
  /\b\d{3}-\d{2}-\d{4}\b/g,

  // Phone numbers in string literals (not port numbers or hex)
  /["'`]\d{3}[-.]?\d{3}[-.]?\d{4}["'`]/g,

  // Email addresses in string literals (potential personal emails)
  /["'`][A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}["'`]/g,

  // Medical Record Numbers in string literals
  /["'`]MRN:?\s*\d{6,}["'`]/gi,

  // Credit card patterns in string literals
  /["'`]\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}["'`]/g,

  // Common PHI field names with actual values (not just variable names)
  /\b(patient_name|patient_ssn|social_security)\s*[:=]\s*["'`]\w+/gi,
];

// Files to scan
const SCAN_EXTENSIONS = new Set([".js", ".ts", ".jsx", ".tsx", ".json", ".md"]);
const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

// Helper predicates to reduce complexity
/** @param {string} line */
const isMarkdownHeader = (line) => /^\s*#{1,6}\s+/.test(line);
/** @param {string} line */
const isSetextUnderline = (line) => /^[=-]+$/.test(line.trim());
/**
 * Determine if current location is inside a fenced markdown code block
 * @param {string[]} lines
 * @param {number} lineNumber 1-based
 */
function isInsideMarkdownCodeBlock(lines, lineNumber) {
  let code = false;
  for (let i = 0; i < lineNumber - 1; i++) {
    if (/^```|^~~~/.test(lines[i].trim())) code = !code;
  }
  return code;
}
/**
 * Check if a match context should be exempted (mentions of PHI or example text)
 * @param {string} surrounding
 */
function isContextExempt(surrounding) {
  const lower = surrounding.toLowerCase();
  return lower.includes("phi") || lower.includes("example");
}

/** @param {string} filePath */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];
  const lines = content.split("\n");

  // Track fenced code blocks for markdown files
  const isMarkdown = filePath.endsWith(".md");
  // track code fences per position on-demand via helper

  for (const [index, pattern] of PHI_PATTERNS.entries()) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      const line = lines[lineNumber - 1];

      // Skip markdown headers (ATX style) and setext headings
      if (isMarkdown && (isMarkdownHeader(line) || (lineNumber > 1 && isSetextUnderline(lines[lineNumber])))) {
        continue;
      }

      // Skip fenced code blocks
      if (isMarkdown && isInsideMarkdownCodeBlock(lines, lineNumber)) {
        continue;
      }

      // Skip explanatory contexts
      const around = content.substring(Math.max(0, match.index - 50), match.index + 50);
      if (isContextExempt(around)) continue;

      violations.push({
        file: filePath,
        line: lineNumber,
        pattern: `Pattern ${index + 1}`,
        match: match[0],
        context: content.substring(Math.max(0, match.index - 30), match.index + 30),
      });
    }
  }

  return violations;
}

/** @param {string} dirPath */
function scanDirectory(dirPath) {
  /** @type {Array<{file:string,line:number,pattern:string,match:string,context:string}>} */
  const violations = [];

  /** @param {string} currentPath */
  function traverse(currentPath) {
    const stats = fs.statSync(currentPath);

    if (stats.isDirectory()) {
      const dirName = path.basename(currentPath);
      if (EXCLUDE_DIRS.has(dirName)) {
        return;
      }

      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        traverse(path.join(currentPath, item));
      }
    } else if (stats.isFile()) {
      const ext = path.extname(currentPath);
      if (SCAN_EXTENSIONS.has(ext)) {
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

    for (const violation of violations) {
      console.error(`\n📄 File: ${violation.file}`);
      console.error(`📍 Line: ${violation.line}`);
      console.error(`🔍 Pattern: ${violation.pattern}`);
      console.error(`📝 Match: ${violation.match}`);
      console.error(`📋 Context: ...${violation.context}...`);
    }

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
