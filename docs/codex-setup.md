# Codex Setup

Copy `codex/config.example.toml` into your Codex config and adjust the repo path if needed.

Recommended workflow:

```bash
pnpm install
pnpm build
agent-budget index --repo .
agent-budget mcp --repo .
```

If your Codex version rejects `required`, `enabled_tools`, or `default_tools_approval_mode`, remove that key and keep the MCP command and args.
