# AGENTS.md

Configuration for AI coding agents working in this repository.

## Agent skills

### Issue tracker

Issues and PRDs live as **GitHub issues** in the fork `LuisErlacher/natively-cluely-ai-assistant` (set as the `gh` default repo, so operations never hit the upstream). Managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root (created lazily by `/domain-modeling`). See `docs/agents/domain.md`.
