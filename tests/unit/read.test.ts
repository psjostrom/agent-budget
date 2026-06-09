import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readBudgeted } from "../../src/commands/read.js";

describe("budgeted read", () => {
  it("returns full small files with line numbers", () => {
    const result = readBudgeted(path.resolve("fixtures/react-ts-app"), "src/chart/ChartTooltip.tsx", 10000);
    expect(result.truncated).toBe(false);
    expect(result.excerpt).toContain("1 |");
  });

  it("truncates large files and redacts secrets", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-read-"));
    fs.writeFileSync(path.join(dir, "big.ts"), `const apiKey = "sk-abcdefghijklmnopqrstuvwxyz";\n${"export const x = 1;\n".repeat(500)}`);
    const result = readBudgeted(dir, "big.ts", 500);
    expect(result.truncated).toBe(true);
    expect(result.excerpt).toContain("[REDACTED");
  });
});
