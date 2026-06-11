import { describe, expect, it } from "vitest";
import { defaultConfig } from "../../src/config/config.js";
import { evaluate } from "../../src/gate/gate.js";

describe("hook policy", () => {
  it("denies broad dump commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "find ." } }, defaultConfig)?.hookSpecificOutput.permissionDecision).toBe("deny");
  });

  it("rewrites test commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "pnpm test" } }, defaultConfig)?.hookSpecificOutput.updatedInput?.command).toBe("frontload run --kind test -- pnpm test");
  });

  it("allows already wrapped commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "frontload run --kind test -- pnpm test" } }, defaultConfig)).toBeNull();
  });

  it("allows unknown safe commands", () => {
    expect(evaluate({ tool_name: "Bash", tool_input: { command: "git status --short" } }, defaultConfig)).toBeNull();
  });
});
