import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildIndex } from "../../src/indexer/indexer.js";

const fixture = path.resolve("fixtures/react-ts-app");

describe("indexer", () => {
  it("indexes fixture files and extracts TypeScript symbols", async () => {
    const index = await buildIndex(fixture);
    const tooltip = index.files.find((f) => f.path === "src/chart/ChartTooltip.tsx");
    expect(tooltip?.exports).toContain("ChartTooltip");
    expect(tooltip?.functions).toContain("formatTooltipValue");
    expect(index.files.find((f) => f.path.endsWith("ChartTooltip.test.tsx"))?.isTest).toBe(true);
  });

  it("extracts imports and dependency edges", async () => {
    const index = await buildIndex(fixture);
    expect(index.edges.some((e) => e.from === "src/chart/GlucoseChart.tsx" && e.to === "src/chart/ChartTooltip.tsx")).toBe(true);
  });

  it("does not crash on unsupported extensions", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "abg-index-"));
    fs.writeFileSync(path.join(dir, "Sample.kt"), "class Sample\nfun callMe() = Unit\n");
    const index = await buildIndex(dir);
    expect(index.files[0].symbols).toContain("Sample");
  });
});
