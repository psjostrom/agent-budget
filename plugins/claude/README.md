# Agent Budget for Claude Code

This folder packages Agent Budget as a Claude Code plugin.

It bundles:

- a Claude plugin manifest
- an Agent Budget skill
- an MCP server configuration
- a launcher that starts the shared Agent Budget CLI MCP server

## Local Development

From the repository root:

```bash
pnpm install
pnpm build
```

Then test the plugin with Claude Code:

```bash
claude --plugin-dir ./plugins/claude
```

Inside Claude Code, use `/mcp` to verify the Agent Budget MCP server is connected.

## Behavior

When the plugin is enabled, Claude Code can call Agent Budget MCP tools for:

- repo indexing
- task dossiers
- indexed search
- budgeted reads
- summarized command output
- diff summaries
- budget reports

The skill tells Claude to prefer those tools before broad raw exploration.
