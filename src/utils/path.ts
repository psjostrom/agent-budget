import path from "node:path";

export function resolveRepo(repo: string): string {
  return path.resolve(process.cwd(), repo);
}

export function rel(repoRoot: string, file: string): string {
  return path.relative(repoRoot, file).split(path.sep).join("/");
}

export function stateDir(repoRoot: string): string {
  return path.join(repoRoot, ".agent-budget");
}

export function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}
