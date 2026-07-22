---
status: accepted
date: 2026-07-22
---

# Canonical fine-grained SourceKind coexists with the legacy union

The legacy `customModeExecutionContract.SourceKind` (15 coarse values, used by
the 2026-07-06 SourceArbiter) stays untouched. Context OS introduces its own,
deliberately finer `SourceKind` union in `electron/intelligence/context-os/sourceKinds.ts`
and maps every canonical kind back onto the legacy kind(s) via `legacyKindsFor()`
instead of rewriting the legacy module.

**Why:** capability grants differ per kind — `profile_resume` vs `profile_jd`
vs `profile_persona`, and `prior_assistant_message` (referent-only) vs
`prior_assistant_claim` (verifiable) — so the coarse union cannot express the
authorization rules Context OS needs. The legacy map lets the two systems be
compared in shadow mode ("would the legacy contract have allowed this?") without
a risky big-bang rewrite.

## Consequences

Two SourceKind unions coexist by design. Any new source category must be added
to the canonical union *and* given a `legacyKindsFor` mapping, or shadow-mode
comparison breaks.
