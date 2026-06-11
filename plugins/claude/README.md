# Frontload for Claude Code

This folder packages Frontload as a Claude Code plugin.

It bundles:

- a Claude plugin manifest
- a Frontload skill
- an MCP server configuration
- a launcher that starts the shared Frontload CLI MCP server

## Local Development

From the repository root:

```bash
pnpm install
pnpm build
```

Recommended user install:

```bash
frontload install claude
```

This copies the Claude Code adapter to `~/.claude/plugins/frontload`.

Then start Claude Code with:

```bash
claude --plugin-dir ~/.claude/plugins/frontload
```

For local development, test the repo plugin with Claude Code:

```bash
claude --plugin-dir ./plugins/claude
```

When the adapter is copied away from this repository, the launchers call the
installed `frontload` binary. If the host cannot find it on `PATH`, set:

```bash
FRONTLOAD_CLI=/absolute/path/to/frontload
```

Inside Claude Code, use `/mcp` to verify the Frontload MCP server is connected.

## Behavior

When the plugin is enabled, Claude Code can call Frontload MCP tools for:

- repo indexing
- task dossiers
- indexed search
- budgeted reads
- summarized command output
- diff summaries
- budget reports

The skill tells Claude to prefer those tools before broad raw exploration.
