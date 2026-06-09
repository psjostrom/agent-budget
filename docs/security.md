# Security

Agent Budget is local-first. It does not call paid LLM APIs and does not make runtime network calls.

Command execution is allowlisted by `agent-budget.config.json` unless `--allow-unconfigured` is passed. Raw command logs are written under `.agent-budget/logs/`. Output summaries redact obvious tokens, API keys, secrets, and passwords with simple pattern matching.

Hooks can deny broad context dumps and rewrite test/typecheck/lint commands through `agent-budget run`.
