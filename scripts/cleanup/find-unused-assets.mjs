import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const assetRoots = ["public", "assets", "styles", "static"].map((dir) =>
  path.join(rootDir, dir),
);

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

async function collectAssets() {
  const assets = [];
  for (const root of assetRoots) {
    try {
      const stats = await fs.stat(root);
      if (!stats.isDirectory()) {
        continue;
      }
    } catch {
      continue;
    }

    const files = await walk(root);
    for (const filePath of files) {
      const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
      if (allowlist.assets?.includes(relPath)) {
        continue;
      }

      const ext = path.extname(filePath).toLowerCase();
      const excluded = [
        ".map",
        ".txt",
        ".md",
        ".html",
        ".json",
        ".js",
      ];
      if (ext === ".json" && relPath.startsWith("public/")) {
        // allowlist handled separately
      } else if (excluded.includes(ext)) {
        continue;
      }

      const buffer = await fs.readFile(filePath);
      const hash = createHash("sha1").update(buffer).digest("hex");
      assets.push({
        path: relPath,
        size: buffer.length,
        hash,
        extension: ext,
      });
    }
  }
  return assets;
}

const assetRecords = await collectAssets();

const searchRoots = [
  "src",
  "scripts",
  "services",
  "pages",
  "styles",
  "tests",
  "index.html",
  "README.md",
];

async function readIfExists(relPath) {
  const targetPath = path.join(rootDir, relPath);
  try {
    const stats = await fs.stat(targetPath);
    if (stats.isDirectory()) {
      const files = await walk(targetPath);
      const contents = await Promise.all(
        files.map(async (file) => ({
          path: path.relative(rootDir, file).replace(/\\/g, "/"),
          content: await fs.readFile(file, "utf8"),
        })),
      );
      return contents;
    }
    return [
      {
        path: relPath,
        content: await fs.readFile(targetPath, "utf8"),
      },
    ];
  } catch {
    return [];
  }
}

const searchFiles = (
  await Promise.all(searchRoots.map((rel) => readIfExists(rel)))
).flat();

const usageMap = new Map(assetRecords.map((asset) => [asset.path, { used: false }]));

for (const file of searchFiles) {
  const content = file.content;
  for (const asset of assetRecords) {
    if (usageMap.get(asset.path)?.used) {
      continue;
    }
    const fileName = path.basename(asset.path);
    if (
      content.includes(asset.path) ||
      content.includes(asset.path.replace(/^public\//, "")) ||
      content.includes(fileName)
    ) {
      usageMap.get(asset.path).used = true;
    }
  }
}

const unusedAssets = assetRecords.filter((asset) => !usageMap.get(asset.path).used);

await fs.mkdir(reportsDir, { recursive: true });
const outputPath = path.join(reportsDir, "assets.json");
await fs.writeFile(
  outputPath,
  JSON.stringify({
    scanned: assetRecords.length,
    unused: unusedAssets,
  }, null, 2),
);

console.log(
  `Asset analysis complete. ${unusedAssets.length} unused assets recorded at ${path.relative(
    rootDir,
    outputPath,
  )}`,
);
