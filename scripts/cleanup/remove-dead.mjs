import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");
const allowlistPath = path.join(__dirname, "allowlist.json");

const isDryRun = process.argv.includes("--dry");

async function loadAllowlist() {
  try {
    const content = await fs.readFile(allowlistPath, "utf8");
    return JSON.parse(content);
  } catch {
    return { modules: [], exports: [], assets: [] };
  }
}

const allowlist = await loadAllowlist();

async function readJson(relPath) {
  try {
    const filePath = path.join(reportsDir, relPath);
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function readText(relPath) {
  try {
    const filePath = path.join(reportsDir, relPath);
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch {
    return "";
  }
}

function recordVote(votes, filePath, tool, detail) {
  const normalized = filePath.replace(/\\/g, "/");
  const entry = votes.get(normalized) ?? {
    file: normalized,
    tools: new Set(),
    details: [],
  };
  entry.tools.add(tool);
  if (detail) {
    entry.details.push({ tool, detail });
  }
  votes.set(normalized, entry);
}

const votes = new Map();

const tsPruneRaw = await readText("tsprune.txt");
if (tsPruneRaw) {
  for (const line of tsPruneRaw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [filePart, ...rest] = line.split(":");
    if (!filePart) continue;
    const relPath = filePart.trim();
    recordVote(votes, relPath, "ts-prune", rest.join(":").trim());
  }
}

const eslintReport = await readJson("eslint.json");
if (Array.isArray(eslintReport)) {
  for (const fileResult of eslintReport) {
    const relPath = path.relative(rootDir, fileResult.filePath || "");
    if (!relPath || relPath.startsWith("..")) continue;
    const relevantMessages = (fileResult.messages || []).filter((message) =>
      [
        "no-unused-vars",
        "@typescript-eslint/no-unused-vars",
        "sonarjs/no-dead-store",
        "no-dead-code",
      ].includes(message.ruleId),
    );
    if (!relevantMessages.length) continue;
    const detail = relevantMessages
      .map((msg) => `${msg.ruleId}@${msg.line}:${msg.column}`)
      .join(", ");
    recordVote(votes, relPath, "eslint", detail);
  }
}

const deadExports = await readJson("dead-exports.json");
if (deadExports?.unused) {
  for (const item of deadExports.unused) {
    if (!item?.file) continue;
    recordVote(votes, item.file, "ts-morph", item.export);
  }
}

const assets = await readJson("assets.json");
if (assets?.unused) {
  for (const asset of assets.unused) {
    if (!asset?.path) continue;
    recordVote(votes, asset.path, "asset-scan", asset.hash);
  }
}

function isConfigFile(filePath) {
  const configNames = [
    "tsconfig.json",
    "vite.config.js",
    "webpack.config.js",
    "jest.config.js",
    "eslint.config.js",
    "eslint.config.cjs",
    "tailwind.config.js",
    "postcss.config.js",
    "playwright.config.ts",
    "cypress.config.ts",
    "cypress.config.js",
    "lighthouserc.json",
    "package.json",
    "package-lock.json",
  ];
  return configNames.some((name) => filePath.endsWith(name));
}

const candidates = [];

for (const vote of votes.values()) {
  const toolCount = vote.tools.size;
  if (toolCount < 2) continue;
  if (allowlist.modules?.includes(vote.file)) continue;
  if (allowlist.assets?.includes(vote.file)) continue;
  if (isConfigFile(vote.file)) continue;
  candidates.push({
    ...vote,
    toolCount,
    tools: Array.from(vote.tools),
  });
}

await fs.mkdir(reportsDir, { recursive: true });
const candidatesPath = path.join(reportsDir, "candidates.json");
await fs.writeFile(
  candidatesPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      candidates,
    },
    null,
    2,
  ),
);

if (!candidates.length) {
  console.log("No consensus candidates found for removal.");
  if (isDryRun) {
    await fs.writeFile(path.join(reportsDir, "remove-dry.txt"), "No candidates.\n");
  }
  process.exit(0);
}

if (isDryRun) {
  const dryPath = path.join(reportsDir, "remove-dry.txt");
  const lines = candidates.map(
    (candidate) =>
      `PENDING: ${candidate.file} (tools: ${candidate.tools.join(", ")}) ${
        candidate.details.length ? `details: ${candidate.details
          .map((d) => `${d.tool}:${d.detail}`)
          .join("; ")}` : ""
      }`,
  );
  await fs.writeFile(dryPath, lines.join("\n") + "\n");
  console.log(`Dry-run summary written to ${path.relative(rootDir, dryPath)}`);
  process.exit(0);
}

// Real removal path (safe trash move)
const trashRoot = path.join(rootDir, ".trash");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const trashDir = path.join(trashRoot, timestamp);
await fs.mkdir(trashDir, { recursive: true });

for (const candidate of candidates) {
  const sourcePath = path.join(rootDir, candidate.file);
  try {
    await fs.stat(sourcePath);
    const destination = path.join(trashDir, candidate.file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.rename(sourcePath, destination);
    console.log(`Moved ${candidate.file} -> ${path.relative(rootDir, destination)}`);
  } catch (error) {
    console.warn(`Failed to move ${candidate.file}: ${error.message}`);
  }
}

console.log(`Files moved to ${path.relative(rootDir, trashDir)}`);
