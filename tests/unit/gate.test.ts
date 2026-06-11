import { describe, expect, it } from "vitest";
import { defaultConfig } from "../../src/config/config.js";
import { evaluate } from "../../src/gate/gate.js";

describe("PreToolUse gate", () => {
  it("rewrites simple test commands through frontload run", () => {
    const result = evaluate({ tool_name: "Bash", tool_input: { command: "pnpm test", description: "run tests" } }, defaultConfig);
    expect(result?.hookSpecificOutput.permissionDecision).toBe("allow");
    expect(result?.hookSpecificOutput.updatedInput).toEqual({
      command: "frontload run --kind test -- pnpm test",
      description: "run tests"
    });
  });

  it("uses a configured runner command when rewriting", () => {
    const result = evaluate({ tool_name: "Bash", tool_input: { command: "pnpm lint" } }, defaultConfig, {
      runnerCommand: "node dist/src/cli/index.js run --repo /tmp/repo"
    });
    expect(result?.hookSpecificOutput.updatedInput?.command).toBe("node dist/src/cli/index.js run --repo /tmp/repo --kind lint -- pnpm lint");
  });

  it("rewrites typecheck commands", () => {
    const result = evaluate({ tool_name: "Bash", tool_input: { command: "npx tsc --noEmit" } }, defaultConfig);
    expect(result?.hookSpecificOutput.updatedInput?.command).toBe("frontload run --kind typecheck -- npx tsc --noEmit");
  });

  it("does not rewrite already budgeted commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "frontload run --kind test -- pnpm test" } }, defaultConfig)).toBeNull();
  });

  it("does not rewrite compound shell commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "pnpm test && pnpm lint" } }, defaultConfig)).toBeNull();
  });

  it("denies broad shell dumps", () => {
    const result = evaluate({ tool_name: "Bash", tool_input: { command: "find ." } }, defaultConfig);
    expect(result?.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(result?.hookSpecificOutput.permissionDecisionReason).toContain("fl_search");
  });

  it("denies noisy generated and lockfile reads", () => {
    const generated = evaluate({ tool_name: "Read", tool_input: { file_path: "src/__snapshots__/view.snap" } }, defaultConfig);
    const lockfile = evaluate({ tool_name: "Read", tool_input: { file_path: "pnpm-lock.yaml" } }, defaultConfig);
    expect(generated?.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(lockfile?.hookSpecificOutput.permissionDecisionReason).toContain("fl_read_budgeted");
  });

  it("allows source reads and unknown tools", () => {
    expect(evaluate({ tool_name: "Read", tool_input: { file_path: "src/gate/gate.ts" } }, defaultConfig)).toBeNull();
    expect(evaluate({ tool_name: "Grep", tool_input: { pattern: "foo" } }, defaultConfig)).toBeNull();
  });

  it("stays inert when disabled", () => {
    expect(
      evaluate({ tool_name: "Bash", tool_input: { command: "pnpm test" } }, { gate: { ...defaultConfig.gate, enabled: false } })
    ).toBeNull();
  });
});
