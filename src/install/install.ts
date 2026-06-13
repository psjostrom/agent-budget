import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type AgentName = "codex" | "claude";

export type WriteResult = {
  path: string;
  action: "created" | "updated" | "skipped";
};

export type InstallResult = {
  agent: AgentName;
  writes: WriteResult[];
  notes: string[];
};

export type InitResult = {
  repoRoot: string;
  project: WriteResult[];
  agents: InstallResult[];
};

type CodexPluginConfig = {
  name: string;
  interface?: { displayName?: string };
  plugins: Array<{
    name: string;
    source: { source: "local"; path: string };
    policy: { installation: "AVAILABLE" | "INSTALLED_BY_DEFAULT" | "NOT_AVAILABLE"; authentication: "ON_INSTALL" | "ON_USE" };
    category: string;
  }>;
};

export function packageRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== path.dirname(dir)) {
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, "utf8")) as { name?: string };
        if (parsed.name === "frontload") return dir;
      } catch {
        // Keep walking upward.
      }
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function copyDir(source: string, target: string, force: boolean, writes: WriteResult[]): void {
  const existed = fs.existsSync(target);
  if (existed) {
    if (!force) {
      writes.push({ path: target, action: "skipped" });
      return;
    }
    fs.rmSync(target, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
  writes.push({ path: target, action: existed ? "updated" : "created" });
}

function copyFile(source: string, target: string, force: boolean): WriteResult {
  const existed = fs.existsSync(target);
  if (existed && !force) return { path: target, action: "skipped" };
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return { path: target, action: existed ? "updated" : "created" };
}

function ensureDir(target: string): WriteResult {
  if (fs.existsSync(target)) return { path: target, action: "skipped" };
  fs.mkdirSync(target, { recursive: true });
  return { path: target, action: "created" };
}

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function upsertCodexPluginConfig(homeDir: string, force: boolean): WriteResult {
  const file = path.join(homeDir, ".agents/plugins/marketplace.json");
  const existed = fs.existsSync(file);
  const codexConfig = readJson<CodexPluginConfig>(file, {
    name: "personal",
    interface: { displayName: "Personal" },
    plugins: []
  });
  const entry = {
    name: "frontload",
    source: { source: "local" as const, path: "./plugins/frontload" },
    policy: { installation: "AVAILABLE" as const, authentication: "ON_INSTALL" as const },
    category: "Productivity"
  };
  const existing = codexConfig.plugins.findIndex((plugin) => plugin.name === entry.name);
  if (existing >= 0) {
    if (!force && JSON.stringify(codexConfig.plugins[existing]) === JSON.stringify(entry)) return { path: file, action: "skipped" };
    codexConfig.plugins[existing] = entry;
    writeJson(file, codexConfig);
    return { path: file, action: "updated" };
  }
  codexConfig.plugins.push(entry);
  writeJson(file, codexConfig);
  return { path: file, action: existed ? "updated" : "created" };
}

export function initProject(repoRoot: string, force = false): WriteResult[] {
  const root = packageRoot();
  const absRepo = path.resolve(repoRoot);
  const writes: WriteResult[] = [
    copyFile(path.join(root, "frontload.config.example.json"), path.join(absRepo, "frontload.config.json"), force),
    copyFile(path.join(root, "AGENTS.example.md"), path.join(absRepo, "AGENTS.md"), force),
    copyFile(path.join(root, "codex/config.example.toml"), path.join(absRepo, "codex/config.toml"), force),
    ensureDir(path.join(absRepo, ".frontload"))
  ];
  return writes;
}

function configureCodex(homeDir = os.homedir(), force = false): InstallResult {
  const writes: WriteResult[] = [];
  const root = packageRoot();
  copyDir(path.join(root, "plugins/codex"), path.join(homeDir, "plugins/frontload"), force, writes);
  upsertCodexPluginConfig(homeDir, force);
  return {
    agent: "codex",
    writes,
    notes: ["Restart Codex after init completes; Frontload will be available from the configured local adapter."]
  };
}

function configureClaude(homeDir = os.homedir(), force = false): InstallResult {
  const writes: WriteResult[] = [];
  const root = packageRoot();
  copyDir(path.join(root, "plugins/claude"), path.join(homeDir, ".claude/plugins/frontload"), force, writes);
  return {
    agent: "claude",
    writes,
    notes: ["Restart Claude Code after init completes; Frontload will be available from the configured local adapter."]
  };
}

function configureAgent(agent: AgentName | "all", homeDir = os.homedir(), force = false): InstallResult[] {
  if (agent === "all") return [configureCodex(homeDir, force), configureClaude(homeDir, force)];
  if (agent === "codex") return [configureCodex(homeDir, force)];
  if (agent === "claude") return [configureClaude(homeDir, force)];
  throw new Error(`Unknown agent: ${agent}`);
}

export function parseAgents(value: string | undefined): Array<AgentName | "all"> {
  if (!value || value === "none") return [];
  const values = value.split(",").map((part) => part.trim()).filter(Boolean);
  for (const agent of values) {
    if (!["codex", "claude", "all"].includes(agent)) throw new Error(`Unknown agent: ${agent}`);
  }
  return values as Array<AgentName | "all">;
}

export function initAll(repoRoot: string, agents: Array<AgentName | "all">, homeDir = os.homedir(), force = false): InitResult {
  return {
    repoRoot: path.resolve(repoRoot),
    project: initProject(repoRoot, force),
    agents: agents.flatMap((agent) => configureAgent(agent, homeDir, force))
  };
}
