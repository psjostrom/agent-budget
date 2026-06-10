#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../src/config/config.js";
import { evaluate } from "../src/gate/gate.js";

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => resolve(input));
  });
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function repoRoot(payload: Record<string, unknown>): string {
  const input = payload.tool_input && typeof payload.tool_input === "object" && !Array.isArray(payload.tool_input) ? (payload.tool_input as Record<string, unknown>) : {};
  return path.resolve(
    stringValue(process.env.CLAUDE_PROJECT_DIR) ??
      stringValue(process.env.CODEX_PROJECT_DIR) ??
      stringValue(payload.cwd) ??
      stringValue(input.cwd) ??
      process.cwd()
  );
}

function distRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

async function main(): Promise<void> {
  try {
    const raw = await readStdin();
    const payload = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const root = repoRoot(payload);
    if (!fs.existsSync(path.join(root, ".agent-budget"))) return;

    const config = loadConfig(root);
    if (!config.gate.enabled) return;

    const cli = path.join(distRoot(), "src/cli/index.js");
    const runnerCommand = `${shellQuote(process.execPath)} ${shellQuote(cli)} run --repo ${shellQuote(root)}`;
    const decision = evaluate(payload, config, { runnerCommand });
    if (decision) process.stdout.write(JSON.stringify(decision));
  } catch {
    // Fail open: a broken gate must never block the user's tool call.
  }
}

void main();
