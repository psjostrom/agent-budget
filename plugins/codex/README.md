# Frontload for Codex

This folder packages Frontload as a Codex plugin.

It bundles:

- a Codex plugin manifest
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
frontload install codex
```

This copies the Codex adapter to `~/plugins/frontload` and adds it to the
personal marketplace at `~/.agents/plugins/marketplace.json`. Restart Codex,
open `/plugins`, choose the Personal marketplace, and install or enable Agent
Budget.

For local development, add this plugin through a local Codex marketplace or copy
it into a personal plugin directory.

The MCP launcher expects the built CLI at:

```text
dist/src/cli/index.js
```

When the adapter is copied away from this repository, the launchers call the
installed `frontload` binary. If the host cannot find it on `PATH`, set:

```bash
FRONTLOAD_CLI=/absolute/path/to/frontload
```

## Behavior

When the plugin is enabled, Codex can call Frontload MCP tools for:

- repo indexing
- task dossiers
- indexed search
- budgeted reads
- summarized command output
- diff summaries
- budget reports

The skill tells Codex to prefer those tools before broad raw exploration.
