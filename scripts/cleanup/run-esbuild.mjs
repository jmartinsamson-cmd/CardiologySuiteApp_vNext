import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reportsDir = path.join(rootDir, "reports", "cleanup");
const entryPoint = path.join(rootDir, "src", "index.ts");
const metaPath = path.join(reportsDir, "meta.json");

await fs.mkdir(reportsDir, { recursive: true });

async function runEsbuild() {
  try {
    const esbuildModule = await import("esbuild");
    const esbuild = esbuildModule.build ? esbuildModule : esbuildModule.default;
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      metafile: true,
      format: "esm",
      platform: "browser",
      sourcemap: false,
      logLevel: "silent",
      outfile: path.join(reportsDir, "bundle.js"),
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });
    if (result.metafile) {
      await fs.writeFile(metaPath, JSON.stringify(result.metafile, null, 2));
    }
    // Remove bundle artifact if generated
    try {
      await fs.unlink(path.join(reportsDir, "bundle.js"));
    } catch {
      // ignore
    }
    console.log(`esbuild metafile written to ${path.relative(rootDir, metaPath)}`);
    return true;
  } catch (error) {
    console.warn(`esbuild unavailable, writing placeholder metafile: ${error.message}`);
    return false;
  }
}

const success = await runEsbuild();
if (!success) {
  const placeholder = {
    error: "esbuild unavailable",
    generatedAt: new Date().toISOString(),
    entryPoint: path.relative(rootDir, entryPoint),
  };
  await fs.writeFile(metaPath, JSON.stringify(placeholder, null, 2));
  console.log(`Placeholder metafile written to ${path.relative(rootDir, metaPath)}`);
}
