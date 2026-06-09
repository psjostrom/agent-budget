import { describe, expect, it } from "vitest";
import { evaluatePreToolUse } from "../../hooks/pre-tool-use-policy.js";

describe("hook policy", () => {
  it("denies broad dump commands", () => {
    expect(evaluatePreToolUse({ tool_input: { command: "find ." } }).decision).toBe("deny");
  });

  it("rewrites test commands", () => {
    expect(evaluatePreToolUse({ tool_input: { command: "pnpm test" } }).updatedInput?.command).toBe("agent-budget run --kind test -- pnpm test");
  });

  it("allows already wrapped commands", () => {
    expect(evaluatePreToolUse({ tool_input: { command: "agent-budget run --kind test -- pnpm test" } }).decision).toBe("allow");
  });

  it("allows unknown safe commands", () => {
    expect(evaluatePreToolUse({ tool_input: { command: "git status --short" } }).decision).toBe("allow");
  });
});
