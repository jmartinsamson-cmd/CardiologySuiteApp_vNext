import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");
const require = createRequire(import.meta.url);

const config = require("./depcheck.config.cjs");

function wildcardToRegex(pattern) {
  return new RegExp(`^${pattern.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&").replace(/\*/g, ".*")}$`);
}

const ignorePatterns = (config.ignoreMatches || []).map(wildcardToRegex);

function isIgnored(dep) {
  return ignorePatterns.some((regex) => regex.test(dep));
}

async function runWithModule() {
  try {
    const module = await import("depcheck");
    const depcheck = module.default ?? module;
    const result = await depcheck(rootDir, {
      ...config,
      ignoreMatches: config.ignoreMatches,
    });
    return result;
  } catch (error) {
    console.warn(`depcheck module unavailable, using fallback: ${error.message}`);
    return null;
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "reports"].includes(entry.name)) continue;
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile()) {
      if (/\.(png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|otf|eot)$/i.test(entry.name)) {
        continue;
      }
      files.push(entryPath);
    }
  }
  return files;
}

async function fallbackCheck() {
  const packageJson = JSON.parse(await fs.readFile(path.join(rootDir, "package.json"), "utf8"));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  const searchRoots = ["src", "scripts", "services", "pages", "tests", "styles"];
  const files = [];
  for (const root of searchRoots) {
    const abs = path.join(rootDir, root);
    try {
      const stats = await fs.stat(abs);
      if (stats.isDirectory()) {
        files.push(...(await walk(abs)));
      } else if (stats.isFile()) {
        files.push(abs);
      }
    } catch {
      // ignore missing directories
    }
  }

  const contents = await Promise.all(
    files.map(async (file) => ({
      file,
      content: await fs.readFile(file, "utf8"),
    })),
  );

  function findUnused(list) {
    const unused = [];
    for (const dep of list) {
      if (isIgnored(dep)) continue;
      const isUsed = contents.some(({ content }) => content.includes(dep));
      if (!isUsed) {
        unused.push(dep);
      }
    }
    return unused;
  }

  return {
    dependencies: findUnused(dependencies),
    devDependencies: findUnused(devDependencies),
    missing: {},
    using: {},
  };
}

let result = await runWithModule();
if (!result) {
  result = await fallbackCheck();
}

await fs.mkdir(reportsDir, { recursive: true });
const outputPath = path.join(reportsDir, "depcheck.json");
await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
console.log(`Depcheck report written to ${path.relative(rootDir, outputPath)}`);
