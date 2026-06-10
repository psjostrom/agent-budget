export type FileCategory = "lockfile" | "generated" | "test" | "docs" | "config" | "source";

export function fileCategory(file: string): FileCategory {
  if (/lock|pnpm-lock|package-lock|yarn.lock/.test(file)) return "lockfile";
  if (/(^|\/)(__snapshots__|fixtures?|generated|demo\/fixtures)|\.(snap|golden)\./.test(file)) return "generated";
  if (/(^|\/)(test|tests|__tests__)\/|(\.|-)(test|spec)\.[^.]+$/.test(file)) return "test";
  if (/README|docs\/|\.md$/.test(file)) return "docs";
  if (/config|\.json|\.toml|\.ya?ml|env/.test(file)) return "config";
  if (/dist|generated|build/.test(file)) return "generated";
  return "source";
}
