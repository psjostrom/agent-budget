import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const authorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  url: z.string().url().optional()
});

const codexPluginSchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  author: authorSchema,
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().min(1).optional(),
  keywords: z.array(z.string()).optional(),
  skills: z.string().startsWith("./"),
  mcpServers: z.string().startsWith("./"),
  interface: z.object({
    displayName: z.string().min(1),
    shortDescription: z.string().min(1),
    longDescription: z.string().min(1),
    developerName: z.string().min(1),
    category: z.string().min(1),
    capabilities: z.array(z.string()).optional(),
    websiteURL: z.string().url().optional(),
    privacyPolicyURL: z.string().url().optional(),
    termsOfServiceURL: z.string().url().optional(),
    defaultPrompt: z.array(z.string().max(128)).max(3).optional(),
    brandColor: z.string().optional()
  })
});

const claudePluginSchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(1),
  author: authorSchema,
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string().min(1).optional()
});

const mcpServerSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional()
}).passthrough();

const mcpConfigSchema = z.object({
  mcpServers: z.record(mcpServerSchema)
});

const hooksConfigSchema = z.object({
  hooks: z.record(
    z.array(
      z.object({
        matcher: z.string().optional(),
        hooks: z.array(
          z.object({
            type: z.literal("command"),
            command: z.string().min(1),
            timeout: z.number().positive().optional(),
            statusMessage: z.string().optional()
          }).passthrough()
        )
      }).passthrough()
    )
  )
});

export type PluginValidationResult = {
  summary: string;
  root: string;
  host: "codex" | "claude";
  checked: string[];
  warnings: string[];
};

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assertFile(file: string, label: string, checked: string[]): void {
  if (!fs.existsSync(file)) throw new Error(`Missing ${label}: ${file}`);
  checked.push(file);
}

function assertExecutable(file: string): void {
  const mode = fs.statSync(file).mode;
  if ((mode & 0o111) === 0) throw new Error(`Launcher is not executable: ${file}`);
}

function assertSkill(file: string): void {
  const text = fs.readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) throw new Error(`Skill is missing YAML frontmatter: ${file}`);
  const end = text.indexOf("\n---", 4);
  if (end === -1) throw new Error(`Skill frontmatter is not closed: ${file}`);
  const body = text.slice(end + 4).trim();
  if (body.length < 40) throw new Error(`Skill body is too short: ${file}`);
}

export function validatePlugin(root: string, host: "codex" | "claude"): PluginValidationResult {
  const absRoot = path.resolve(root);
  const checked: string[] = [];
  const warnings: string[] = [];
  const manifestFile = path.join(absRoot, host === "codex" ? ".codex-plugin/plugin.json" : ".claude-plugin/plugin.json");
  const mcpFile = path.join(absRoot, ".mcp.json");
  const launcherFile = path.join(absRoot, "bin/agent-budget-mcp");
  const gateLauncherFile = path.join(absRoot, "bin/agent-budget-gate");
  const hooksFile = path.join(absRoot, "hooks/hooks.json");
  const skillFile = path.join(absRoot, "skills/agent-budget/SKILL.md");

  assertFile(manifestFile, `${host} plugin manifest`, checked);
  assertFile(mcpFile, "MCP config", checked);
  assertFile(launcherFile, "MCP launcher", checked);
  assertFile(skillFile, "Agent Budget skill", checked);

  const manifest = readJson(manifestFile);
  if (host === "codex") codexPluginSchema.parse(manifest);
  else claudePluginSchema.parse(manifest);

  const mcp = mcpConfigSchema.parse(readJson(mcpFile));
  if (!mcp.mcpServers.agent_budget) throw new Error(`${mcpFile} must define mcpServers.agent_budget`);
  if (!mcp.mcpServers.agent_budget.command.includes("agent-budget-mcp")) {
    warnings.push("agent_budget MCP command does not reference the bundled launcher");
  }

  assertExecutable(launcherFile);
  if (fs.existsSync(hooksFile) || fs.existsSync(gateLauncherFile)) {
    assertFile(hooksFile, "hooks config", checked);
    hooksConfigSchema.parse(readJson(hooksFile));
    assertFile(gateLauncherFile, "gate launcher", checked);
    assertExecutable(gateLauncherFile);
  }
  assertSkill(skillFile);

  return {
    summary: `${host} plugin validation passed (${checked.length} files checked).`,
    root: absRoot,
    host,
    checked,
    warnings
  };
}

export function validateBundledPlugins(repoRoot = process.cwd()): PluginValidationResult[] {
  return [
    validatePlugin(path.join(repoRoot, "plugins/codex"), "codex"),
    validatePlugin(path.join(repoRoot, "plugins/claude"), "claude")
  ];
}
