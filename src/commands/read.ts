import fs from "node:fs";
import path from "node:path";
import { loadIndex } from "../indexer/indexer.js";
import { capText, lineNumbered, redactSecrets, words } from "../utils/text.js";

export function readBudgeted(repoRoot: string, filePath: string, budgetChars = 4000, query?: string): { summary: string; path: string; fileSize: number; lineCount: number; requestedBudget: number; excerpt: string; truncated: boolean; suggestedNextReads: string[]; redactions: number } {
  const abs = path.resolve(repoRoot, filePath);
  const textRaw = fs.readFileSync(abs, "utf8");
  const { text, redactions } = redactSecrets(textRaw);
  const lines = text.split(/\r?\n/);
  let excerpt = text;
  if (text.length > budgetChars) {
    const selected = new Set<number>();
    for (let i = 0; i < Math.min(lines.length, 80); i++) selected.add(i);
    const terms = words(query ?? "");
    if (terms.length) {
      lines.forEach((line, i) => {
        if (terms.some((t) => line.toLowerCase().includes(t))) {
          for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) selected.add(j);
        }
      });
    }
    lines.forEach((line, i) => {
      if (/^\s*(import|export|class|function|const\s+[A-Z]|interface|type)\b/.test(line)) {
        for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 8); j++) selected.add(j);
      }
    });
    excerpt = [...selected]
      .sort((a, b) => a - b)
      .map((i) => lines[i])
      .join("\n");
  }
  const numbered = lineNumbered(excerpt);
  const capped = capText(numbered, budgetChars);
  const index = loadIndex(repoRoot);
  const suggestedNextReads = index?.edges.filter((e) => e.from === filePath).map((e) => e.to).slice(0, 5) ?? [];
  return {
    summary: capped.truncated ? `Returned bounded excerpt for ${filePath}; full file is ${text.length} chars.` : `Returned full file ${filePath}.`,
    path: filePath,
    fileSize: Buffer.byteLength(textRaw),
    lineCount: lines.length,
    requestedBudget: budgetChars,
    excerpt: capped.text,
    truncated: capped.truncated || text.length > budgetChars,
    suggestedNextReads,
    redactions
  };
}
