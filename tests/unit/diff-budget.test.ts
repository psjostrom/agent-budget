import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import { describe, expect, it } from "vitest";
import { appendEvent, budgetReport } from "../../src/budget/events.js";
import { gitDiffSummary } from "../../src/diff/diff.js";

describe("diff and budget", () => {
  it("writes JSONL events and reports largest outputs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-budget-"));
    appendEvent(dir, { source: "cli", operation: "read", inputChars: 10, outputChars: 40, durationMs: 1, success: true });
    const report = budgetReport(dir);
    expect(report.operations).toBe(1);
    expect(report.byOperation.read.estimatedTokens).toBe(10);
  });

  it("summarizes changed files and detects lockfile risk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-diff-"));
    await execa("git", ["init"], { cwd: dir });
    fs.writeFileSync(path.join(dir, "package.json"), "{}");
    fs.writeFileSync(path.join(dir, "pnpm-lock.yaml"), "lockfileVersion: 9");
    await execa("git", ["add", "."], { cwd: dir });
    await execa("git", ["commit", "-m", "init"], { cwd: dir, env: { GIT_AUTHOR_NAME: "A", GIT_AUTHOR_EMAIL: "a@example.com", GIT_COMMITTER_NAME: "A", GIT_COMMITTER_EMAIL: "a@example.com" } });
    fs.appendFileSync(path.join(dir, "pnpm-lock.yaml"), "\nchanged");
    const summary = await gitDiffSummary(dir);
    expect(summary.changedFiles[0].category).toBe("lockfile");
    expect(summary.summary).not.toContain("diff --git");
  });
});
