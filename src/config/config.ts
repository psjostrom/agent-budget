import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const configSchema = z.object({
  repoRoot: z.string().default("."),
  ignore: z.array(z.string()).default([]),
  index: z.object({
    maxFileBytes: z.number().int().positive().default(300000),
    extensions: z.array(z.string()).default([".ts", ".tsx", ".js", ".jsx", ".json", ".md"])
  }),
  budgets: z.object({
    defaultDossierChars: z.number().int().positive().default(12000),
    defaultReadChars: z.number().int().positive().default(4000),
    maxToolOutputChars: z.number().int().positive().default(8000),
    maxRawLogBytes: z.number().int().positive().default(5000000)
  }),
  commands: z.object({
    allowed: z.array(z.string()).default([]),
    timeoutMs: z.number().int().positive().default(120000)
  }),
  security: z.object({
    redactSecrets: z.boolean().default(true),
    blockDangerousShell: z.boolean().default(true)
  }),
  localScout: z.object({
    enabled: z.boolean().default(false),
    command: z.string().nullable().default(null),
    timeoutMs: z.number().int().positive().default(60000),
    maxOutputChars: z.number().int().positive().default(6000)
  })
});

export type AgentBudgetConfig = z.infer<typeof configSchema>;

export const defaultConfig: AgentBudgetConfig = configSchema.parse({
  repoRoot: ".",
  ignore: ["node_modules/**", ".git/**", "dist/**", "build/**", "coverage/**", "**/*.lock", ".agent-budget/**"],
  index: { maxFileBytes: 300000, extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".kt", ".kts"] },
  budgets: { defaultDossierChars: 12000, defaultReadChars: 4000, maxToolOutputChars: 8000, maxRawLogBytes: 5000000 },
  commands: { allowed: ["pnpm test", "pnpm vitest", "pnpm tsc", "npm test", "yarn test", "npx tsc", "git diff", "git status"], timeoutMs: 120000 },
  security: { redactSecrets: true, blockDangerousShell: true },
  localScout: { enabled: false, command: null, timeoutMs: 60000, maxOutputChars: 6000 }
});

function mergeConfig(base: AgentBudgetConfig, partial: unknown): AgentBudgetConfig {
  const p = partial as Partial<AgentBudgetConfig>;
  return configSchema.parse({
    ...base,
    ...p,
    index: { ...base.index, ...p.index },
    budgets: { ...base.budgets, ...p.budgets },
    commands: { ...base.commands, ...p.commands },
    security: { ...base.security, ...p.security },
    localScout: { ...base.localScout, ...p.localScout }
  });
}

export function loadConfig(repoRoot: string): AgentBudgetConfig {
  const file = path.join(repoRoot, "agent-budget.config.json");
  if (!fs.existsSync(file)) return defaultConfig;
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  return mergeConfig(defaultConfig, raw);
}
