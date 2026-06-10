import { describe, expect, it } from "vitest";
import { fileCategory } from "../../src/utils/category.js";

describe("fileCategory", () => {
  it("classifies lockfiles", () => {
    expect(fileCategory("pnpm-lock.yaml")).toBe("lockfile");
    expect(fileCategory("package-lock.json")).toBe("lockfile");
  });

  it("classifies fixtures, snapshots and generated as generated", () => {
    expect(fileCategory("src/__snapshots__/Foo.snap")).toBe("generated");
    expect(fileCategory("tests/fixtures/data.ts")).toBe("generated");
    expect(fileCategory("lib/demo/fixtures.ts")).toBe("generated");
    expect(fileCategory("dist/bundle.js")).toBe("generated");
  });

  it("classifies tests, docs and config", () => {
    expect(fileCategory("src/Foo.test.ts")).toBe("test");
    expect(fileCategory("README.md")).toBe("docs");
    expect(fileCategory("tsconfig.json")).toBe("config");
  });

  it("classifies real source", () => {
    expect(fileCategory("src/chart/ChartTooltip.tsx")).toBe("source");
  });
});
