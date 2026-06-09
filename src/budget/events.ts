import fs from "node:fs";
import path from "node:path";
import { BudgetEvent } from "../types.js";
import { estimateTokens } from "../utils/text.js";
import { stateDir } from "../utils/path.js";

export function appendEvent(repoRoot: string, event: Omit<BudgetEvent, "timestamp" | "estimatedInputTokens" | "estimatedOutputTokens">): void {
  const dir = stateDir(repoRoot);
  fs.mkdirSync(dir, { recursive: true });
  const full: BudgetEvent = {
    timestamp: new Date().toISOString(),
    estimatedInputTokens: estimateTokens(event.inputChars),
    estimatedOutputTokens: estimateTokens(event.outputChars),
    ...event
  };
  fs.appendFileSync(path.join(dir, "events.jsonl"), JSON.stringify(full) + "\n");
}

export function readEvents(repoRoot: string): BudgetEvent[] {
  const file = path.join(stateDir(repoRoot), "events.jsonl");
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BudgetEvent);
}

export function budgetReport(repoRoot: string): { summary: string; operations: number; byOperation: Record<string, { outputChars: number; estimatedTokens: number; count: number }>; largest: BudgetEvent[]; last20: BudgetEvent[] } {
  const events = readEvents(repoRoot);
  const byOperation: Record<string, { outputChars: number; estimatedTokens: number; count: number }> = {};
  for (const event of events) {
    byOperation[event.operation] ??= { outputChars: 0, estimatedTokens: 0, count: 0 };
    byOperation[event.operation].outputChars += event.outputChars;
    byOperation[event.operation].estimatedTokens += event.estimatedOutputTokens;
    byOperation[event.operation].count += 1;
  }
  const largest = [...events].sort((a, b) => b.outputChars - a.outputChars).slice(0, 10);
  return {
    summary: `${events.length} operations logged. Token counts are estimated as chars / 4.`,
    operations: events.length,
    byOperation,
    largest,
    last20: events.slice(-20)
  };
}
