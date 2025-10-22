import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");

async function readJson(relPath) {
  try {
    const content = await fs.readFile(path.join(reportsDir, relPath), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function readText(relPath) {
  try {
    return await fs.readFile(path.join(reportsDir, relPath), "utf8");
  } catch {
    return "";
  }
}

await fs.mkdir(reportsDir, { recursive: true });

const baseline = await readJson("baseline.json");
const deadExports = await readJson("dead-exports.json");
const assets = await readJson("assets.json");
const candidates = await readJson("candidates.json");
const depcheck = await readJson("depcheck.json");
const tsprune = await readText("tsprune.txt");
const dryRun = await readText("remove-dry.txt");

const summaryLines = [];
summaryLines.push("# Cleanup Summary\n");
summaryLines.push(`Generated: ${new Date().toISOString()}`);
if (baseline) {
  summaryLines.push(
    `Branch: ${baseline.branch ?? "unknown"} (commit ${baseline.commit?.slice(0, 7) ?? "n/a"})`,
  );
}
summaryLines.push("");

if (candidates?.candidates?.length) {
  summaryLines.push("## Files flagged by multiple tools\n");
  for (const candidate of candidates.candidates) {
    summaryLines.push(
      `- ${candidate.file} — tools: ${candidate.tools.join(", ")}${
        candidate.details?.length
          ? ` (details: ${candidate.details
              .map((detail) => `${detail.tool}:${detail.detail}`)
              .join("; ")})`
          : ""
      }`,
    );
  }
  summaryLines.push("");
} else {
  summaryLines.push("## Files flagged by multiple tools\n");
  summaryLines.push("- None yet. Run additional scans to gather evidence.\n");
}

if (deadExports?.unused?.length) {
  summaryLines.push("## Dead exports\n");
  for (const entry of deadExports.unused) {
    summaryLines.push(`- ${entry.file} :: ${entry.export}`);
  }
  summaryLines.push("");
}

if (assets?.unused?.length) {
  summaryLines.push("## Unused assets\n");
  for (const asset of assets.unused) {
    summaryLines.push(`- ${asset.path} (${asset.size} bytes)`);
  }
  summaryLines.push("");
}

if (tsprune) {
  const lines = tsprune
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 20);
  if (lines.length) {
    summaryLines.push("## ts-prune (sample)\n");
    for (const line of lines) {
      summaryLines.push(`- ${line}`);
    }
    if (tsprune.split(/\r?\n/).filter(Boolean).length > lines.length) {
      summaryLines.push("- ...");
    }
    summaryLines.push("");
  }
}

if (dryRun) {
  summaryLines.push("## Removal dry-run\n");
  summaryLines.push("```");
  summaryLines.push(dryRun.trim() || "No candidates.");
  summaryLines.push("```");
  summaryLines.push("");
}

const depCommands = [];
if (depcheck?.dependencies?.length) {
  for (const dep of depcheck.dependencies) {
    depCommands.push(`npm uninstall ${dep}`);
  }
}
if (depcheck?.devDependencies?.length) {
  for (const dep of depcheck.devDependencies) {
    depCommands.push(`npm uninstall --save-dev ${dep}`);
  }
}

if (depCommands.length) {
  summaryLines.push("## Suggested dependency pruning commands\n");
  for (const command of depCommands) {
    summaryLines.push(`- ${command}`);
  }
  summaryLines.push("");
}

let estimatedBytes = 0;
if (assets?.unused) {
  estimatedBytes += assets.unused.reduce((sum, item) => sum + (item.size ?? 0), 0);
}
if (candidates?.candidates) {
  for (const candidate of candidates.candidates) {
    try {
      const stats = await fs.stat(path.join(rootDir, candidate.file));
      estimatedBytes += stats.size;
    } catch {
      // ignore missing files
    }
  }
}

summaryLines.push("## Estimated size impact\n");
summaryLines.push(`Potential savings: ${(estimatedBytes / 1024).toFixed(2)} KiB\n`);

const summaryPath = path.join(reportsDir, "summary.md");
await fs.writeFile(summaryPath, summaryLines.join("\n"));

// Dep prune script
const depScriptPath = path.join(reportsDir, "dep-prune.sh");
const depScript = [
  "#!/usr/bin/env bash",
  "set -euo pipefail",
  "# Suggested commands based on depcheck analysis",
  ...depCommands,
];
await fs.writeFile(depScriptPath, depScript.join("\n") + "\n");

// Move plan generation
async function buildMovePlan() {
  const srcDir = path.join(rootDir, "src");
  const targetNamespaces = new Set(["ai", "parsers", "server", "ui", "utils"]);

  async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walk(entryPath)));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(entryPath);
      }
    }
    return files;
  }

  let srcExists = false;
  try {
    const stats = await fs.stat(srcDir);
    srcExists = stats.isDirectory();
  } catch {
    srcExists = false;
  }

  if (!srcExists) {
    return [];
  }

  const sourceFiles = await walk(srcDir);

  const rootLevel = sourceFiles.filter((file) => {
    const rel = path.relative(srcDir, file).replace(/\\/g, "/");
    return !rel.includes("/");
  });

  const plans = [];

  for (const filePath of rootLevel) {
    const rel = path.relative(srcDir, filePath).replace(/\\/g, "/");
    const content = await fs.readFile(filePath, "utf8");
    const importMatches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
    const counts = new Map();
    for (const match of importMatches) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      const resolved = path
        .relative(
          srcDir,
          path.resolve(path.dirname(filePath), specifier),
        )
        .replace(/\\/g, "/");
      const [namespace] = resolved.split("/");
      if (targetNamespaces.has(namespace)) {
        counts.set(namespace, (counts.get(namespace) ?? 0) + 1);
      }
    }
    if (!counts.size) continue;
    const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!best) continue;
    const [namespace, score] = best;
    if (namespace && namespace !== rel.split("/")[0]) {
      plans.push({ file: `src/${rel}`, target: `src/${namespace}/`, score });
    }
  }

  return plans;
}

const movePlan = await buildMovePlan();
const movePlanLines = ["# Proposed source moves", ""];
if (movePlan.length) {
  for (const item of movePlan) {
    movePlanLines.push(`- ${item.file} -> ${item.target} (score: ${item.score})`);
  }
} else {
  movePlanLines.push("- No immediate moves suggested from import graph analysis.");
}
movePlanLines.push("");

const movePlanPath = path.join(reportsDir, "move-plan.md");
await fs.writeFile(movePlanPath, movePlanLines.join("\n"));

console.log(`Summary written to ${path.relative(rootDir, summaryPath)}`);
