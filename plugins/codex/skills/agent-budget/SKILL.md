---
name: agent-budget
description: Use when working in a code repository to reduce context cost with Agent Budget MCP tools, task dossiers, budgeted reads, summarized command output, and token-cost reports.
---

# Agent Budget

Use Agent Budget before broad repository exploration.

Default workflow:

1. Start with `abg_repo_dossier` for the current task.
2. Use `abg_search` when the dossier says ranking confidence is noisy or when you need concrete symbols.
3. Use `abg_read_budgeted` for file contents instead of raw full-file reads.
4. Run tests, typechecks, lint, and build commands through `abg_run_summary`.
5. Use `abg_git_diff_summary` before reviewing changes.
6. Use `abg_budget_report` before repeating repair loops.

Avoid raw `find .`, `ls -R`, broad recursive grep, full lockfile dumps, generated fixture dumps, and unwrapped test commands.

If the MCP server is unavailable, ask the user to build Agent Budget with `pnpm build` and reload the plugin.
