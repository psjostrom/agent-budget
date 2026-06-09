# Agent Budget for Codex

This folder packages Agent Budget as a Codex plugin.

It bundles:

- a Codex plugin manifest
- an Agent Budget skill
- an MCP server configuration
- a launcher that starts the shared Agent Budget CLI MCP server

## Local Development

From the repository root:

```bash
pnpm install
pnpm build
```

Then add this plugin through a local Codex marketplace or copy it into a personal plugin directory.

The MCP launcher expects the built CLI at:

```text
dist/src/cli/index.js
```

## Behavior

When the plugin is enabled, Codex can call Agent Budget MCP tools for:

- repo indexing
- task dossiers
- indexed search
- budgeted reads
- summarized command output
- diff summaries
- budget reports

The skill tells Codex to prefer those tools before broad raw exploration.
