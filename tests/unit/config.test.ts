import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/config.js";

describe("config", () => {
  it("loads default config", () => {
    expect(loadConfig(process.cwd()).budgets.defaultReadChars).toBeGreaterThan(0);
  });

  it("loads repo config", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-config-"));
    fs.writeFileSync(path.join(dir, "agent-budget.config.json"), JSON.stringify({ budgets: { defaultReadChars: 1234 } }));
    expect(loadConfig(dir).budgets.defaultReadChars).toBe(1234);
  });

  it("validates invalid config with helpful errors", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-config-bad-"));
    fs.writeFileSync(path.join(dir, "agent-budget.config.json"), JSON.stringify({ budgets: { defaultReadChars: -1 } }));
    expect(() => loadConfig(dir)).toThrow();
  });

  it("respects ignore globs in defaults", () => {
    expect(loadConfig(process.cwd()).ignore).toContain("node_modules/**");
  });
});
