import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { initAll, initProject, parseAgents } from "../../src/install/install.js";

describe("installer", () => {
  it("initializes project files and onboarded state", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "frontload-init-"));
    const result = initProject(repo);
    expect(result.map((write) => path.relative(repo, write.path))).toEqual([
      "frontload.config.json",
      "AGENTS.md",
      "codex/config.toml",
      ".frontload"
    ]);
    expect(fs.existsSync(path.join(repo, "frontload.config.json"))).toBe(true);
    expect(fs.existsSync(path.join(repo, ".frontload"))).toBe(true);
  });

  it("configures Codex from init", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "frontload-init-codex-"));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "frontload-home-codex-"));
    const result = initAll(repo, ["codex"], home);
    const codexConfigFile = path.join(home, ".agents/plugins/marketplace.json");
    const codexConfig = JSON.parse(fs.readFileSync(codexConfigFile, "utf8"));

    expect(result.agents.map((agent) => agent.agent)).toEqual(["codex"]);
    expect(result.agents[0].writes.map((write) => path.relative(home, write.path))).toEqual(["plugins/frontload"]);
    expect(fs.existsSync(path.join(home, "plugins/frontload/.codex-plugin/plugin.json"))).toBe(true);
    expect(codexConfig.plugins).toContainEqual({
      name: "frontload",
      source: { source: "local", path: "./plugins/frontload" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Productivity"
    });
  });

  it("configures all supported agent adapters from init", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "frontload-init-all-"));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "frontload-home-all-"));
    const result = initAll(repo, ["all"], home);
    expect(result.agents.map((agent) => agent.agent)).toEqual(["codex", "claude"]);
    expect(fs.existsSync(path.join(home, "plugins/frontload/.codex-plugin/plugin.json"))).toBe(true);
    expect(fs.existsSync(path.join(home, ".claude/plugins/frontload/.claude-plugin/plugin.json"))).toBe(true);
  });

  it("parses agent lists", () => {
    expect(parseAgents("codex,claude")).toEqual(["codex", "claude"]);
    expect(parseAgents("none")).toEqual([]);
    expect(() => parseAgents("cursor")).toThrow("Unknown agent");
  });
});
