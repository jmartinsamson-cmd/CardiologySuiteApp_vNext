#!/usr/bin/env node
/* eslint-env node */
// Validate JSON data files
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
// JSON syntax validation; supports --clean to try cleaning via CommonJS helper

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else if (e.isFile() && e.name.endsWith(".json")) {
      yield full;
    }
  }
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const defaultBase = path.resolve(__dirname, "..", "data");
  let errors = 0;
  const args = process.argv.slice(2);
  const useCleaner = args.includes("--clean");
  const targets = args.filter((a) => a !== "--clean");

  // Avoid dynamic import in CI/CD environments - use basic JSON validation
  let cleaner = null;
  if (useCleaner) {
    try {
      const cleanerModule = await import("../data/validate_json.cjs");
      cleaner = cleanerModule.validateAndCleanJSON;
    } catch (importError) {
      console.warn(
        "Warning: Could not load cleaner module, using basic validation:",
        importError.message,
      );
    }
  }

  const pathsToCheck = targets.length > 0 ? targets : [defaultBase];
  const files = [];
  for (const p of pathsToCheck) {
    const full = path.isAbsolute(p) ? p : path.resolve(p);
    if (!fs.existsSync(full)) {
      console.error("Path not found:", full);
      errors++;
      continue;
    }
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      for (const f of walk(full)) files.push(f);
    } else if (stat.isFile() && full.endsWith(".json")) {
      files.push(full);
    }
  }

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    try {
      if (useCleaner && cleaner) {
        await cleaner(text);
      } else {
        JSON.parse(text);
      }
    } catch (e) {
      errors++;
      console.error(`Invalid JSON: ${file}\n${e.message}\n`);
    }
  }
  if (errors) {
    console.error(`Found ${errors} invalid JSON file(s).`);
    process.exit(1);
  } else {
    console.log(
      `All JSON files in data/ are valid JSON${useCleaner ? " (cleaned check)" : ""}.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
