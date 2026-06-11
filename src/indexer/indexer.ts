import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";
import { FrontloadConfig, loadConfig } from "../config/config.js";
import { DependencyEdge, IndexedFile, RepoIndex } from "../types.js";
import { rel, stateDir } from "../utils/path.js";
import { words } from "../utils/text.js";

const codeExts = new Set([".ts", ".tsx", ".js", ".jsx"]);

function hash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function keywords(filePath: string): string[] {
  return words(filePath.replace(/([a-z])([A-Z])/g, "$1 $2"));
}

function fallbackSymbols(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\b(?:class|fun|function|const|let|var|interface|type)\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
    found.add(match[1]);
  }
  return [...found];
}

function analyzeCode(filePath: string, text: string): Pick<IndexedFile, "imports" | "exports" | "functions" | "classes" | "types" | "components" | "hooks" | "symbols"> {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: { jsx: 4, allowJs: true } });
  const source = project.createSourceFile(filePath, text);
  const imports = source.getImportDeclarations().map((d) => d.getModuleSpecifierValue());
  const exports = new Set<string>();
  const functions = new Set<string>();
  const classes = new Set<string>();
  const types = new Set<string>();
  const components = new Set<string>();
  const hooks = new Set<string>();

  for (const decl of source.getExportedDeclarations().keys()) exports.add(decl);
  for (const fn of source.getFunctions()) {
    const name = fn.getName();
    if (name) functions.add(name);
  }
  for (const v of source.getVariableDeclarations()) {
    const name = v.getName();
    const init = v.getInitializer();
    if (init && [SyntaxKind.ArrowFunction, SyntaxKind.FunctionExpression].includes(init.getKind())) functions.add(name);
  }
  for (const c of source.getClasses()) {
    const name = c.getName();
    if (name) classes.add(name);
  }
  for (const i of source.getInterfaces()) types.add(i.getName());
  for (const t of source.getTypeAliases()) types.add(t.getName());

  for (const name of [...functions, ...classes]) {
    if (/^[A-Z]/.test(name)) components.add(name);
    if (/^use[A-Z0-9]/.test(name)) hooks.add(name);
  }
  const symbols = Array.from(new Set([...exports, ...functions, ...classes, ...types, ...components, ...hooks]));
  return { imports, exports: [...exports], functions: [...functions], classes: [...classes], types: [...types], components: [...components], hooks: [...hooks], symbols };
}

function resolveImport(from: string, specifier: string, files: Map<string, IndexedFile>): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.posix.join(base, "index.ts"), path.posix.join(base, "index.tsx")];
  return candidates.find((candidate) => files.has(candidate));
}

export async function buildIndex(repoRoot: string, config: FrontloadConfig = loadConfig(repoRoot)): Promise<RepoIndex> {
  const entries = await fg(["**/*"], {
    cwd: repoRoot,
    dot: true,
    onlyFiles: true,
    ignore: config.ignore,
    absolute: true
  });
  const files: IndexedFile[] = [];
  let ignoredCount = 0;
  let indexedBytes = 0;
  for (const abs of entries) {
    const st = fs.statSync(abs);
    const ext = path.extname(abs);
    if (!config.index.extensions.includes(ext) || st.size > config.index.maxFileBytes) {
      ignoredCount += 1;
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    const filePath = rel(repoRoot, abs);
    const base = {
      path: filePath,
      extension: ext,
      size: st.size,
      mtimeMs: st.mtimeMs,
      hash: hash(text),
      lineCount: text.split(/\r?\n/).length,
      isTest: /(^|[./_-])(test|spec)\.[jt]sx?$/.test(filePath) || /\.(test|spec)\.[jt]sx?$/.test(filePath),
      keywords: keywords(filePath)
    };
    const symbols = codeExts.has(ext)
      ? analyzeCode(filePath, text)
      : { imports: [], exports: [], functions: [], classes: [], types: [], components: [], hooks: [], symbols: fallbackSymbols(text) };
    indexedBytes += st.size;
    files.push({ ...base, ...symbols });
  }
  const byPath = new Map(files.map((f) => [f.path, f]));
  const edges: DependencyEdge[] = [];
  for (const file of files) {
    for (const spec of file.imports) {
      const to = resolveImport(file.path, spec, byPath);
      if (to) edges.push({ from: file.path, to, importPath: spec });
    }
  }
  const index: RepoIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    repoRoot,
    files,
    edges,
    stats: { fileCount: files.length, indexedBytes, ignoredCount }
  };
  fs.mkdirSync(stateDir(repoRoot), { recursive: true });
  const out = path.join(stateDir(repoRoot), "index.json");
  const tmp = `${out}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(index, null, 2));
  fs.renameSync(tmp, out);
  return index;
}

export function loadIndex(repoRoot: string): RepoIndex | undefined {
  const file = path.join(stateDir(repoRoot), "index.json");
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as RepoIndex;
  } catch {
    return undefined;
  }
}
