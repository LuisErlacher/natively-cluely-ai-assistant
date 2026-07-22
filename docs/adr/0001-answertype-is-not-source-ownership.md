---
status: accepted
date: 2026-07-22
---

# AnswerType is not Source Ownership

The question classifier labels each turn with an `AnswerType` (e.g.
`resume_jd_fit_answer`, `jd_requirements_answer`, `general_assistant`). We
decided that `AnswerType` describes only the *shape* of the answer and never
decides which Source is authorized to ground it — Source Ownership is owned by
the Mode Source Authority plus the `TurnContextContract`, not the classifier.

**Why:** treating `AnswerType` as ownership is exactly how the six JD-family
answer types silently fell through to the `general_assistant`/no-profile default
in `ContextRouter.ts` and `ProfileIntelligenceRouter.ts` (fixed in the Phase 5
context-ownership audit) — "why am I a fit for this JD?" got `useProfileTree:
false`, the opposite of correct. Keeping the two concepts separate is enforced
as invariant #1 of the Source Authority Architect.
