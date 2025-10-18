#!/usr/bin/env node
/* eslint-env node */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { validateAndCleanJSON } = await import("../data/validate_json.cjs");

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

function writeOut(baseIn, baseOut, file, content) {
  const rel = path.relative(baseIn, file);
  const outPath = path.join(baseOut, rel);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
}

async function main() {
  const src = path.resolve(__dirname, "..", "data");
  const out = path.resolve(__dirname, "..", "data_cleaned");
  const dryRun =
    process.argv.includes("--dry-run") || !process.argv.includes("--write");

  let changed = 0;
  let errors = 0;
  for (const file of walk(src)) {
    const text = fs.readFileSync(file, "utf8");
    try {
      const cleaned = await validateAndCleanJSON(text);
      if (cleaned !== text) {
        changed++;
        if (dryRun) {
          console.log("Would write cleaned:", file);
        } else {
          writeOut(src, out, file, cleaned);
          console.log(
            "Wrote cleaned:",
            path.join("data_cleaned", path.relative(src, file)),
          );
        }
      }
    } catch (e) {
      errors++;
      console.error("Failed to clean:", file, "\n", e.message);
    }
  }
  if (errors) {
    console.error(`Completed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(
      `Completed. ${changed} file(s) would be cleaned${dryRun ? " (dry-run)" : ""}.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
