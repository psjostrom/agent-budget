---
name: agent-budget
description: Use this when working in a code repository with the Agent Budget MCP server to reduce context, summarize tests, produce task dossiers, and avoid expensive broad exploration.
---

# Agent Budget

Start with `abg_repo_dossier` for the current task. Use `abg_search` for indexed search and `abg_read_budgeted` for bounded file excerpts.

Run tests, typechecks, and lint through `abg_run_summary` so raw logs stay local while failures are summarized. Use `abg_git_diff_summary` before reviewing changes and `abg_budget_report` before repeating repair loops.

Avoid raw `find .`, `ls -R`, broad `grep -R`, full lockfile dumps, and unwrapped test commands.
