import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findUnusedExports } from "./export-graph.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");
const allowlistPath = path.join(__dirname, "allowlist.json");

async function loadAllowlist() {
  try {
    const content = await fs.readFile(allowlistPath, "utf8");
    return JSON.parse(content);
  } catch {
    return { modules: [], exports: [], assets: [] };
  }
}

const allowlist = await loadAllowlist();

const results = await findUnusedExports(allowlist);

await fs.mkdir(reportsDir, { recursive: true });
const outputPath = path.join(reportsDir, "dead-exports.json");
await fs.writeFile(outputPath, JSON.stringify({ unused: results }, null, 2));
console.log(`Dead export report written to ${path.relative(rootDir, outputPath)}`);
