# Architecture

Frontload has four local components:

- Indexer: scans supported files and writes `.frontload/index.json`.
- Dossier generator: ranks files for a task using lexical matches, symbols, dependency edges, tests, and path clues.
- Budgeted tools: bounded reads, summarized commands, compact diffs, and budget reports.
- MCP server: exposes the same capabilities to Codex over stdio.

No runtime path sends source code to an external service.
