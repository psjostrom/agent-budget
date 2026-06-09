#!/usr/bin/env node

type HookResponse = {
  decision: "allow" | "deny";
  reason?: string;
  updatedInput?: Record<string, unknown>;
  additionalContext?: string;
};

function getCommand(payload: any): string {
  return payload?.tool_input?.command ?? payload?.input?.command ?? payload?.command ?? "";
}

export function evaluatePreToolUse(payload: any): HookResponse {
  const command = getCommand(payload).trim();
  if (!command) return { decision: "allow" };
  if (/agent-budget\s+run/.test(command)) return { decision: "allow" };
  if (/^(cat\s+(package-lock\.json|pnpm-lock\.yaml)|find\s+\.|ls\s+-R|grep\s+-R)/.test(command) || (/^rg\b/.test(command) && !/--files|-g|src\/|tests\/|fixtures\//.test(command))) {
    return { decision: "deny", reason: "This command can dump broad raw context. Use abg_search, abg_read_budgeted, or abg_git_diff_summary instead." };
  }
  if (/^(pnpm|npm|yarn)\s+test\b/.test(command)) return { decision: "allow", updatedInput: { command: `agent-budget run --kind test -- ${command}` } };
  if (/^(pnpm\s+tsc|npx\s+tsc|tsc\b)/.test(command)) return { decision: "allow", updatedInput: { command: `agent-budget run --kind typecheck -- ${command}` } };
  if (/^(pnpm\s+lint|npm\s+run\s+lint|yarn\s+lint|eslint\b)/.test(command)) return { decision: "allow", updatedInput: { command: `agent-budget run --kind lint -- ${command}` } };
  if (/^rg\b/.test(command)) return { decision: "allow", additionalContext: "Prefer abg_search for broad exploration and abg_read_budgeted for file contents." };
  return { decision: "allow" };
}

if (process.argv[1]?.endsWith("pre-tool-use-policy.js") || process.argv[1]?.endsWith("pre-tool-use-policy.ts")) {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    const payload = input.trim() ? JSON.parse(input) : {};
    process.stdout.write(JSON.stringify(evaluatePreToolUse(payload)));
  });
}
