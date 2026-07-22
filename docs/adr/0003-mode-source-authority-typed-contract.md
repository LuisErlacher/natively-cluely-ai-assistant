---
status: accepted
date: 2026-07-22
---

# Mode Source Authority is a persisted typed contract, not re-derived from prose

A Mode's source policy (`defaultOwner`, `sourceAuthority`, allowed explicit
switches, conflict policy) is stored as an explicit, typed, persisted
`ModeSourceContract` (`electron/services/modeSourceContract.ts`) — a closed set
of enums describing the *shape* of a policy, hardcoding no file names, mode ids,
or entities. It is written once and read back identically every turn.

**Why:** the previous design re-derived `documentGrounded`/`sourceAuthority` on
every turn by running two regexes (`DOCUMENT_SOURCE_RE`, `DOCUMENT_CONSTRAINT_RE`)
against the Mode's free-form `customContext`. A user's natural phrasing of
"answer from my uploaded thesis" routinely failed to satisfy both regexes at
once, silently downgrading the Mode to `general_mixed` (everything allowed) with
zero visibility — the root cause of the P0 contamination incident where thesis
questions were answered from the candidate's résumé. Persisting the contract
removes the re-derivation drift and makes the policy visible and machine-checkable.
