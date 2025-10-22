import { spawn } from "node:child_process";
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
    const data = await fs.readFile(allowlistPath, "utf8");
    return JSON.parse(data);
  } catch {
    return { modules: [], exports: [] };
  }
}

function runCli() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      [
        "--yes",
        "ts-prune",
        "--ignore",
        "index.ts",
        "--ignore",
        "**/*.d.ts",
      ],
      { cwd: rootDir, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `ts-prune exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function fallback() {
  const allowlist = await loadAllowlist();
  const unused = await findUnusedExports(allowlist);
  const filtered = unused.filter((item) => {
    return !item.file.endsWith("index.ts") && !item.file.endsWith(".d.ts");
  });
  return filtered.map((item) => `${item.file}: ${item.export}`).join("\n");
}

let output = "";
try {
  output = await runCli();
} catch (error) {
  console.warn(`ts-prune unavailable, using fallback: ${error.message}`);
  output = await fallback();
}

await fs.mkdir(reportsDir, { recursive: true });
const outputPath = path.join(reportsDir, "tsprune.txt");
await fs.writeFile(outputPath, output);
console.log(`ts-prune results written to ${path.relative(rootDir, outputPath)}`);
