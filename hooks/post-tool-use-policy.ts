#!/usr/bin/env node

export function evaluatePostToolUse(payload: any): { feedback?: string } {
  const output = payload?.tool_output ?? payload?.output ?? "";
  const text = typeof output === "string" ? output : JSON.stringify(output);
  if (text.length > 12000) return { feedback: "Large raw output detected. Use agent-budget run or an Agent Budget MCP summary tool next time." };
  return {};
}

if (process.argv[1]?.endsWith("post-tool-use-policy.js") || process.argv[1]?.endsWith("post-tool-use-policy.ts")) {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    const payload = input.trim() ? JSON.parse(input) : {};
    process.stdout.write(JSON.stringify(evaluatePostToolUse(payload)));
  });
}
