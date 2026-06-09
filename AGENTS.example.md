# Agent Budget workflow

Before broad exploration, call `abg_repo_dossier`.

Prefer:
- `abg_search` over broad grep
- `abg_read_budgeted` over raw full-file reads
- `abg_run_summary` over raw test/typecheck commands
- `abg_git_diff_summary` over raw full diff dumps
- `abg_budget_report` before and after large tasks

Do not read unrelated files unless the dossier suggests them or you explain why.

Do not run more than two repair loops on the same failure without checking `abg_budget_report` and creating a new focused dossier.

When tests fail, pass only the summarized failure back into reasoning unless the full log is truly needed.
