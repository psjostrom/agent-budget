import { FrontloadConfig } from "../config/config.js";
import { fileCategory } from "../utils/category.js";

export type HookPermissionDecision = "allow" | "deny" | "ask";

export type PreToolUseHookOutput = {
  hookSpecificOutput: {
    hookEventName: "PreToolUse";
    permissionDecision: HookPermissionDecision;
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;
    additionalContext?: string;
  };
};

export type GateOptions = {
  /** Full command prefix for Frontload's run subcommand, without --kind. */
  runnerCommand?: string;
};

type GatePayload = {
  tool_name?: unknown;
  tool_input?: unknown;
};

function toolInput(payload: GatePayload): Record<string, unknown> {
  return payload.tool_input && typeof payload.tool_input === "object" && !Array.isArray(payload.tool_input) ? (payload.tool_input as Record<string, unknown>) : {};
}

function textField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function output(
  permissionDecision: HookPermissionDecision,
  permissionDecisionReason?: string,
  updatedInput?: Record<string, unknown>,
  additionalContext?: string
): PreToolUseHookOutput {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision,
      ...(permissionDecisionReason ? { permissionDecisionReason } : {}),
      ...(updatedInput ? { updatedInput } : {}),
      ...(additionalContext ? { additionalContext } : {})
    }
  };
}

function hasShellControl(command: string): boolean {
  return /[;&|<>`]/.test(command);
}

function alreadyBudgeted(command: string): boolean {
  return /\bfrontload\s+run\b/.test(command) || /dist\/src\/cli\/index\.js["']?\s+run\b/.test(command);
}

function commandKind(command: string): "test" | "typecheck" | "lint" | null {
  if (hasShellControl(command)) return null;
  if (/^(?:(?:pnpm|npm|yarn)\s+(?:run\s+)?test|(?:npx\s+)?(?:vitest|jest))(\s|$)/.test(command)) return "test";
  if (/^(?:(?:pnpm|npm|yarn)\s+(?:run\s+)?typecheck|(?:pnpm\s+|npx\s+)?tsc)(\s|$)/.test(command)) return "typecheck";
  if (/^(?:(?:pnpm|npm|yarn)\s+(?:run\s+)?lint|(?:npx\s+)?eslint)(\s|$)/.test(command)) return "lint";
  return null;
}

function broadShellReason(command: string): string | null {
  if (/\bgrep\s+-(?:[A-Za-z]*R[A-Za-z]*|[A-Za-z]*r[A-Za-z]*)\b/.test(command)) {
    return "Broad recursive grep can dump raw context. Use mcp__frontload__fl_search with a focused query instead.";
  }
  if (/^find\s+\.(?:\s|$)/.test(command)) {
    return "Broad find output can dump raw context. Use mcp__frontload__fl_search for indexed discovery instead.";
  }
  if (/^ls\s+-(?:[A-Za-z]*R[A-Za-z]*)(?:\s|$)/.test(command)) {
    return "Recursive ls can dump raw context. Use mcp__frontload__fl_search or mcp__frontload__fl_git_diff_summary instead.";
  }
  if (/^cat\s+(?:\.\/)?(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock)(?:\s|$)/.test(command)) {
    return "Lockfiles are noisy. Use mcp__frontload__fl_read_budgeted with a focused query, or mcp__frontload__fl_search.";
  }
  return null;
}

export function evaluate(payload: GatePayload, config: Pick<FrontloadConfig, "gate">, options: GateOptions = {}): PreToolUseHookOutput | null {
  if (!config.gate.enabled) return null;

  const name = textField(payload.tool_name);
  const input = toolInput(payload);

  if (name === "Bash") {
    const command = textField(input.command).trim();
    if (!command || alreadyBudgeted(command)) return null;

    if (config.gate.rewriteCommands) {
      const kind = commandKind(command);
      if (kind) {
        const runner = options.runnerCommand ?? "frontload run";
        return output("allow", `Run ${kind} through Frontload so Claude receives a compact summary.`, {
          ...input,
          command: `${runner} --kind ${kind} -- ${command}`
        });
      }
    }

    if (config.gate.blockBroadShell) {
      const reason = broadShellReason(command);
      if (reason) return output("deny", reason);
    }

    return null;
  }

  if (name === "Read") {
    const filePath = textField(input.file_path);
    const category = filePath ? fileCategory(filePath) : "source";
    if (config.gate.blockNoisyReads && (category === "generated" || category === "lockfile")) {
      return output(
        "deny",
        `This ${category} file is noisy. Use mcp__frontload__fl_read_budgeted with a focused query, or mcp__frontload__fl_search before reading it.`
      );
    }
  }

  return null;
}
