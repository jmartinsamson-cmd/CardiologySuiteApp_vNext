#!/usr/bin/env node
/* eslint-disable no-unused-vars */

/**
 * Import Analysis Script
 *
 * Analyzes JavaScript/TypeScript files to detect:
 * 1. Circular dependencies
 * 2. Unused exports
 * 3. Files with zero references
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, extname } from "path";

const projectRoot = process.cwd();
const srcDirs = ["src", "pages", "scripts"];
const fileMap = new Map(); // file -> { imports: [], exports: [], importedBy: [] }

function isJsFile(path) {
  const ext = extname(path);
  return [".js", ".ts", ".mjs"].includes(ext) && !path.includes("node_modules");
}

function findAllFiles(dir) {
  const files = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !entry.startsWith(".") &&
          entry !== "node_modules" &&
          entry !== "test-results"
        ) {
          files.push(...findAllFiles(fullPath));
        }
      } else if (isJsFile(fullPath)) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }

  return files;
}

function extractImportsExports(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    const imports = [];
    const exports = [];

    // Match ES6 imports: import ... from '...'
    const importMatches = content.matchAll(
      /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g,
    );
    for (const match of importMatches) {
      imports.push(match[1]);
    }

    // Match dynamic imports: import('...')
    const dynamicMatches = content.matchAll(
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    );
    for (const match of dynamicMatches) {
      imports.push(match[1]);
    }

    // Match exports
    const exportNamedMatches = content.matchAll(
      /export\s+(?:const|let|var|function|class)\s+([\w]+)/g,
    );
    for (const match of exportNamedMatches) {
      exports.push(match[1]);
    }

    // Match export { ... }
    const exportBlockMatches = content.matchAll(/export\s*{([^}]+)}/g);
    for (const match of exportBlockMatches) {
      const names = match[1]
        .split(",")
        .map((n) => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }

    // Match export default
    if (content.includes("export default")) {
      exports.push("default");
    }

    return { imports, exports };
  } catch (e) {
    return { imports: [], exports: [] };
  }
}

function resolveImportPath(fromFile, importPath) {
  // Handle relative imports
  if (importPath.startsWith(".")) {
    const fromDir = fromFile.substring(0, fromFile.lastIndexOf("/"));
    let resolved = join(fromDir, importPath);

    // Try adding extensions if not present
    if (!isJsFile(resolved)) {
      for (const ext of [".js", ".ts", ".mjs"]) {
        const withExt = resolved + ext;
        try {
          statSync(withExt);
          return withExt;
        } catch {
          // File doesn't exist with this extension
        }
      }
    }

    return resolved;
  }

  return null; // External or unresolved
}

function buildDependencyGraph() {
  console.log("📂 Scanning project files...\n");

  const allFiles = [];
  for (const dir of srcDirs) {
    const dirPath = join(projectRoot, dir);
    try {
      allFiles.push(...findAllFiles(dirPath));
    } catch (e) {
      // Directory doesn't exist
    }
  }

  console.log(`Found ${allFiles.length} JavaScript/TypeScript files\n`);

  // Build initial map
  for (const file of allFiles) {
    const { imports, exports } = extractImportsExports(file);
    fileMap.set(file, {
      imports,
      exports,
      importedBy: [],
      resolvedImports: [],
    });
  }

  // Resolve imports and build importedBy relationships
  for (const [file, data] of fileMap.entries()) {
    for (const imp of data.imports) {
      const resolved = resolveImportPath(file, imp);
      if (resolved && fileMap.has(resolved)) {
        data.resolvedImports.push(resolved);
        fileMap.get(resolved).importedBy.push(file);
      }
    }
  }
}

function detectCircularDependencies() {
  const cycles = [];
  const visited = new Set();
  const recStack = new Set();

  function dfs(file, path = []) {
    if (recStack.has(file)) {
      // Found a cycle
      const cycleStart = path.indexOf(file);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart);
        cycle.push(file);
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(file)) return;

    visited.add(file);
    recStack.add(file);
    path.push(file);

    const data = fileMap.get(file);
    if (data) {
      for (const imp of data.resolvedImports) {
        dfs(imp, [...path]);
      }
    }

    recStack.delete(file);
  }

  for (const file of fileMap.keys()) {
    if (!visited.has(file)) {
      dfs(file);
    }
  }

  return cycles;
}

function findUnreferencedFiles() {
  const unreferenced = [];

  for (const [file, data] of fileMap.entries()) {
    if (
      data.importedBy.length === 0 &&
      !file.includes("app.js") &&
      !file.includes("sw.js")
    ) {
      unreferenced.push(file);
    }
  }

  return unreferenced;
}

function generateReport() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("               DEAD CODE ANALYSIS REPORT                   ");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Circular dependencies
  const cycles = detectCircularDependencies();
  console.log("🔄 CIRCULAR DEPENDENCIES\n");

  if (cycles.length === 0) {
    console.log("✅ No circular dependencies detected!\n");
  } else {
    console.log(`❌ Found ${cycles.length} circular dependency chain(s):\n`);

    const uniqueCycles = new Map();
    for (const cycle of cycles) {
      const key = cycle
        .map((f) => relative(projectRoot, f))
        .sort()
        .join(" -> ");
      if (!uniqueCycles.has(key)) {
        uniqueCycles.set(key, cycle);
      }
    }

    let cycleNum = 1;
    for (const cycle of uniqueCycles.values()) {
      console.log(`  ${cycleNum}. Circular chain:`);
      for (let i = 0; i < cycle.length; i++) {
        const file = relative(projectRoot, cycle[i]);
        console.log(`     ${i === 0 ? "→" : " "} ${file}`);
      }
      console.log();
      cycleNum++;
    }
  }

  console.log("─────────────────────────────────────────────────────────\n");

  // Files with zero references
  const unreferenced = findUnreferencedFiles();
  console.log("📄 FILES WITH ZERO REFERENCES\n");

  if (unreferenced.length === 0) {
    console.log("✅ All files are referenced!\n");
  } else {
    console.log(
      `❌ Found ${unreferenced.length} file(s) that are never imported:\n`,
    );

    for (const file of unreferenced) {
      const relPath = relative(projectRoot, file);
      const data = fileMap.get(file);
      console.log(`  • ${relPath}`);
      if (data && data.exports.length > 0) {
        console.log(`    Exports: ${data.exports.join(", ")}`);
      }
    }
    console.log();
  }

  console.log("─────────────────────────────────────────────────────────\n");

  // Unused exports (from knip)
  console.log("📦 UNUSED EXPORTS (from knip analysis)\n");
  console.log("See knip-report.json for detailed export analysis\n");

  console.log("═══════════════════════════════════════════════════════════\n");

  // Summary statistics
  console.log("📊 SUMMARY STATISTICS\n");
  console.log(`  Total files analyzed: ${fileMap.size}`);
  console.log(`  Files with zero references: ${unreferenced.length}`);
  console.log(`  Circular dependency chains: ${cycles.length}`);
  console.log();
}

// Run analysis
buildDependencyGraph();
generateReport();
