import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");

function safeExec(command) {
  try {
    return execSync(command, { cwd: rootDir, encoding: "utf8" }).trim();
  } catch (error) {
    return `error: ${error.message}`;
  }
}

const baseline = {
  generatedAt: new Date().toISOString(),
  branch: safeExec("git rev-parse --abbrev-ref HEAD"),
  commit: safeExec("git rev-parse HEAD"),
  status: safeExec("git status -sb"),
  nodeVersion: process.version,
  npmVersion: safeExec("npm --version"),
  platform: {
    platform: process.platform,
    arch: process.arch,
    release: safeExec("uname -a"),
  },
  env: {
    NODE_ENV: process.env.NODE_ENV ?? "",
    CI: process.env.CI ?? "",
  },
};

await fs.mkdir(reportsDir, { recursive: true });
const jsonPath = path.join(reportsDir, "baseline.json");
const txtPath = path.join(reportsDir, "baseline.txt");

await fs.writeFile(jsonPath, JSON.stringify(baseline, null, 2));

const txtLines = [
  `Generated: ${baseline.generatedAt}`,
  `Branch: ${baseline.branch}`,
  `Commit: ${baseline.commit}`,
  "",
  "Git Status:",
  baseline.status,
  "",
  `Node: ${baseline.nodeVersion}`,
  `npm: ${baseline.npmVersion}`,
  `Platform: ${baseline.platform.release}`,
];

await fs.writeFile(txtPath, txtLines.join("\n"));

console.log(`Baseline written to ${path.relative(rootDir, jsonPath)}`);
