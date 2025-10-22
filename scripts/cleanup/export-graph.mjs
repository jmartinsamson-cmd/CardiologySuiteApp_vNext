import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");

const includeRoots = ["src", "scripts", "services"];
const supportedExtensions = [".ts", ".tsx", ".js", ".mjs", ".cjs"];

function matchesSupported(filePath) {
  return supportedExtensions.includes(path.extname(filePath));
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "reports", ".trash"].includes(entry.name)) continue;
      files.push(...(await walk(entryPath)));
    } else if (entry.isFile() && matchesSupported(entryPath)) {
      files.push(entryPath);
    }
  }
  return files;
}

async function resolveImportPath(fromFile, specifier) {
  if (!specifier) return null;
  if (!(specifier.startsWith(".") || specifier.startsWith("/"))) {
    return null;
  }
  const base = specifier.startsWith("/")
    ? path.join(rootDir, specifier)
    : path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.mjs"),
    path.join(base, "index.cjs"),
  ];
  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        return path.relative(rootDir, candidate).replace(/\\/g, "/");
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function collectFileInfo(filePath, content) {
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".ts") || filePath.endsWith(".tsx")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS,
  );

  const exports = [];
  const imports = [];
  const reExports = [];

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const record = {
        moduleSpecifier,
        named: [],
        hasNamespace: false,
        hasDefault: false,
      };
      if (node.importClause) {
        if (node.importClause.name) {
          record.hasDefault = true;
        }
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const element of node.importClause.namedBindings.elements) {
              record.named.push(element.propertyName?.text ?? element.name.text);
            }
          } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            record.hasNamespace = true;
          }
        }
      }
      imports.push(record);
    } else if (ts.isExportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier?.text ?? null;
      if (moduleSpecifier) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          const names = node.exportClause.elements.map((el) => el.propertyName?.text ?? el.name.text);
          reExports.push({ moduleSpecifier, names, exportAll: false });
        } else {
          reExports.push({ moduleSpecifier, names: [], exportAll: true });
        }
      } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          exports.push({
            name: element.name.text,
            kind: "ReExport",
          });
        }
      }
    } else if (ts.isExportAssignment(node)) {
      exports.push({
        name: "default",
        kind: ts.SyntaxKind[node.kind] ?? "ExportAssignment",
      });
    } else if (node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) {
            exports.push({ name: declaration.name.text, kind: ts.SyntaxKind[node.kind] ?? "VariableStatement" });
          }
        }
      } else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        if (node.name && ts.isIdentifier(node.name)) {
          exports.push({ name: node.name.text, kind: ts.SyntaxKind[node.kind] ?? "Exported" });
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return { exports, imports, reExports };
}

export async function findUnusedExports(allowlist = { modules: [], exports: [] }) {
  const allFiles = [];
  for (const root of includeRoots) {
    const abs = path.join(rootDir, root);
    try {
      const stats = await fs.stat(abs);
      if (stats.isDirectory()) {
        allFiles.push(...(await walk(abs)));
      }
    } catch {
      // ignore missing dirs
    }
  }

  const fileInfos = new Map();
  for (const absPath of allFiles) {
    const relPath = path.relative(rootDir, absPath).replace(/\\/g, "/");
    const content = await fs.readFile(absPath, "utf8");
    fileInfos.set(relPath, collectFileInfo(absPath, content));
  }

  const usageMap = new Map();
  for (const [relPath] of fileInfos) {
    usageMap.set(relPath, { names: new Set(), useAll: false });
  }

  async function markUsage(fromFile, moduleSpecifier, names, useAll) {
    const target = await resolveImportPath(path.join(rootDir, fromFile), moduleSpecifier);
    if (!target) return;
    const usage = usageMap.get(target);
    if (!usage) return;
    if (useAll) {
      usage.useAll = true;
      return;
    }
    for (const name of names) {
      usage.names.add(name);
    }
  }

  for (const [relPath, info] of fileInfos) {
    for (const record of info.imports) {
      const names = [];
      if (record.hasDefault) {
        names.push("default");
      }
      if (record.hasNamespace) {
        await markUsage(relPath, record.moduleSpecifier, [], true);
        continue;
      }
      if (record.named.length) {
        names.push(...record.named);
      }
      if (names.length) {
        await markUsage(relPath, record.moduleSpecifier, names, false);
      }
    }
    for (const reExport of info.reExports) {
      if (reExport.exportAll) {
        await markUsage(relPath, reExport.moduleSpecifier, [], true);
      } else if (reExport.names.length) {
        await markUsage(relPath, reExport.moduleSpecifier, reExport.names, false);
      }
    }
  }

  const unused = [];
  for (const [relPath, info] of fileInfos) {
    if (allowlist.modules?.includes(relPath)) {
      continue;
    }
    const usage = usageMap.get(relPath) ?? { names: new Set(), useAll: false };
    for (const exp of info.exports) {
      const key = `${relPath}#${exp.name}`;
      if (allowlist.exports?.includes(key)) {
        continue;
      }
      const isUsed = usage.useAll || usage.names.has(exp.name) || (exp.name === "default" && usage.names.has("default"));
      if (!isUsed) {
        unused.push({ file: relPath, export: exp.name, kind: exp.kind });
      }
    }
  }

  return unused;
}
