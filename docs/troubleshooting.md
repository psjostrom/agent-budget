# Troubleshooting

## Command is not allowed

Add a safe prefix to `commands.allowed` in `agent-budget.config.json`, or use `--allow-unconfigured` for a trusted one-off local run.

## Dossier is empty

Run `agent-budget index --repo .` first and make the task description include concrete file, domain, or symbol words.

## Codex config key rejected

Codex config schemas vary by version. Keep the MCP `command` and `args`, then remove optional keys such as `required` or `enabled_tools`.
