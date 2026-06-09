import { buildIndex, loadIndex } from "../indexer/indexer.js";
import { IndexedFile, RepoIndex } from "../types.js";
import { capText, words } from "../utils/text.js";

type Ranked = { file: IndexedFile; score: number; why: string[]; relatedTests: string[] };

function scoreFile(file: IndexedFile, taskWords: string[], index: RepoIndex): Ranked {
  let score = 0;
  const why: string[] = [];
  const pathWords = words(file.path);
  const symbolWords = words(file.symbols.join(" "));
  const importWords = words([...file.imports, ...file.exports].join(" "));
  const pathMatches = taskWords.filter((w) => pathWords.includes(w)).length;
  const symbolMatches = taskWords.filter((w) => symbolWords.includes(w)).length;
  const importMatches = taskWords.filter((w) => importWords.includes(w)).length;
  if (pathMatches) {
    score += pathMatches * 20;
    why.push("path match");
  }
  if (symbolMatches) {
    score += symbolMatches * 14;
    why.push("symbol match");
  }
  if (importMatches) {
    score += importMatches * 8;
    why.push("import/export match");
  }
  if (file.isTest) score += 5;
  const relatedTests = index.files
    .filter((f) => f.isTest && (f.path.includes(file.path.replace(/\.[^.]+$/, "")) || f.path.includes(file.path.split("/").at(-1)!.replace(/\.[^.]+$/, ""))))
    .map((f) => f.path);
  if (relatedTests.length) {
    score += 10;
    why.push("related test");
  }
  const connected = index.edges.filter((e) => e.from === file.path || e.to === file.path).length;
  if (connected) {
    score += Math.min(connected * 2, 10);
    why.push("dependency edge");
  }
  if (/billing|unrelated/i.test(file.path)) score -= 15;
  return { file, score, why, relatedTests };
}

export async function generateDossier(repoRoot: string, task: string, budgetChars = 12000, maxFiles = 12): Promise<{ markdown: string; ranked: Ranked[]; truncated: boolean }> {
  const index = loadIndex(repoRoot) ?? (await buildIndex(repoRoot));
  const taskWords = words(task);
  const ranked = index.files
    .map((file) => scoreFile(file, taskWords, index))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, maxFiles);
  const suggested = ranked.map((r) => r.file.path);
  const testFiles = ranked.flatMap((r) => (r.file.isTest ? [r.file.path] : r.relatedTests)).filter((v, i, arr) => arr.indexOf(v) === i);
  const lines = [
    "# Agent Budget Dossier",
    "",
    "## Task",
    "",
    task,
    "",
    "## Budget",
    "",
    `- Requested budget: ${budgetChars} chars`,
    `- Estimated token equivalent: ${Math.ceil(budgetChars / 4)}`,
    `- Generated at: ${new Date().toISOString()}`,
    "",
    "## Related tests / commands",
    "",
    ...testFiles.map((p) => `- \`pnpm test ${p.split("/").at(-1)?.replace(/\.[^.]+$/, "") ?? ""}\``),
    "- `pnpm tsc --noEmit`",
    "",
    "## Most relevant files",
    "",
    ...ranked.flatMap((r, i) => [
      `${i + 1}. \`${r.file.path}\``,
      `   - score: ${Math.round(r.score)}`,
      `   - why: ${r.why.join(", ") || "weak lexical match"}`,
      `   - symbols: ${r.file.symbols.slice(0, 8).join(", ") || "none"}`,
      `   - related tests: ${r.relatedTests.join(", ") || "none"}`
    ]),
    "",
    "## Suggested read order",
    "",
    ...suggested.map((p, i) => `${i + 1}. \`${p}\``),
    "",
    "## Dependency notes",
    "",
    ...index.edges
      .filter((e) => suggested.includes(e.from) || suggested.includes(e.to))
      .slice(0, 20)
      .map((e) => `- \`${e.from}\` imports \`${e.to}\``),
    "",
    "## Context limits",
    "",
    "This dossier intentionally omits raw file contents. Use `abg_read_budgeted` for targeted reads."
  ];
  const capped = capText(lines.join("\n"), Math.floor(budgetChars * 1.1));
  return { markdown: capped.text, ranked, truncated: capped.truncated };
}

export async function searchIndex(repoRoot: string, query: string, limit = 10): Promise<Ranked[]> {
  const index = loadIndex(repoRoot) ?? (await buildIndex(repoRoot));
  return index.files
    .map((file) => scoreFile(file, words(query), index))
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, limit);
}
