import { execa } from "execa";
import { capText } from "../utils/text.js";

function category(file: string): string {
  if (/lock|pnpm-lock|package-lock|yarn.lock/.test(file)) return "lockfile";
  if (/test|spec/.test(file)) return "test";
  if (/README|docs\//.test(file)) return "docs";
  if (/config|\.json|\.toml|\.ya?ml|env/.test(file)) return "config";
  if (/dist|generated|build/.test(file)) return "generated";
  return "source";
}

export async function gitDiffSummary(repoRoot: string, staged = false): Promise<{ summary: string; changedFiles: Array<{ path: string; added: number; removed: number; category: string; risky: boolean }>; riskyChanges: string[]; truncated: boolean }> {
  const args = ["diff", "--numstat", ...(staged ? ["--staged"] : [])];
  const num = await execa("git", args, { cwd: repoRoot, reject: false });
  const changedFiles = num.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [a, r, file] = line.split(/\s+/);
      const cat = category(file);
      const risky = cat === "lockfile" || /package\.json|auth|security|secret|env/.test(file);
      return { path: file, added: Number(a) || 0, removed: Number(r) || 0, category: cat, risky };
    });
  const riskyChanges = changedFiles.filter((f) => f.risky).map((f) => f.path);
  const names = changedFiles.map((f) => `- ${f.path}: +${f.added}/-${f.removed}, ${f.category}${f.risky ? ", risky" : ""}`).join("\n");
  const capped = capText(`Changed files: ${changedFiles.length}\n${names || "No diff."}\n\nRisky changes:\n${riskyChanges.map((r) => `- ${r}`).join("\n") || "- none"}`, 8000);
  return { summary: capped.text, changedFiles, riskyChanges, truncated: capped.truncated };
}
