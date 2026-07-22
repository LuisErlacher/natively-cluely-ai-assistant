# Natively — Domain Context

Natively is a personal-use, source-available AI **interview copilot & meeting
assistant**: a desktop app that listens to a live conversation, transcribes it,
and generates grounded answers and notes in real time.

This file is the project's **ubiquitous language** — the canonical glossary that
the code, README, ADRs, and design docs must agree on. It is a glossary only:
no implementation details, no design decisions (those live in `docs/adr/`).
When a term below has an `_Avoid_` list, prefer the bold term and treat the
others as the same concept written badly.

## Product surface

**Overlay**:
The always-on-top floating window that shows suggested answers and notes over
whatever the user is doing.
_Avoid_: HUD, popup, window

**Launcher**:
The initial window used to start/configure a session, before the Overlay takes
over the same reused window.

**Stealth Mode**:
The app state in which Natively hides itself from the dock, screen-share
capture, and popups so it is not visible to the other party.
_Avoid_: invisible mode, hidden mode, undetectable mode

**Session**:
One continuous run of listening + assisting over a single meeting or interview.

## Audio & transcription

**Dual-Channel**:
The separation of captured audio into two independent streams — System Audio and
Microphone — so the other party's speech never contaminates the user's dictation
and vice versa.

**System Audio**:
What the *other* party says, captured via loopback ("what they say").
_Avoid_: them-channel, speaker audio, output audio

**Microphone**:
What the *user* says or dictates ("what you say").
_Avoid_: mic-channel, input audio, my audio

**STT**:
Speech-to-text transcription of an audio channel. May run on-device (Local
Whisper) or via a cloud STT relay.

**Local Whisper**:
On-device STT running quantized ONNX Whisper/Moonshine models, with zero cloud
transmission of audio.

## Modes

**Mode**:
The active persona that shapes the system prompt, the allowed knowledge, and the
note template for a session (e.g. Technical Interview, Sales, Lecture).
_Avoid_: Persona, Profile, Preset — "Persona" is the README's marketing word;
the code, DB, and IPC all say **Mode**. Never say Profile (that is candidate data).

**Mode Template**:
One of the seven built-in Modes shipped with the app: General, Looking for Work,
Technical Interview, Sales, Recruiting, Team Meet, Lecture.
_Avoid_: default mode, preset persona

**Custom Mode**:
A user-created Mode with its own prompt, sources, and note sections.

**Mode Source Authority**:
The default knowledge universe a Mode is allowed to answer from
(e.g. `reference_files_only`, `profile_only`, `general_mixed`, `ask_if_ambiguous`).
It is an explicit, persisted, typed contract per Mode — never re-derived from
prose. This decides the *default* Source Owner for a turn.
_Avoid_: mode grounding, document mode flag

**Custom Context**:
The free-form text area (capped ~8,000 chars) the user pastes instructions or
crib notes into, injected into live prompts.
_Avoid_: Notes (collides with Meeting Notes), custom instructions, crib sheet

## Candidate & job

**Candidate**:
The person using Natively in an interview — the "I"/"me" whose answers are
generated in the first person.

**Profile**:
The candidate's own factual record (resume, projects, persona) used to ground
first-person answers. Profile data is PII and is forbidden wholesale in
reference-file-only Modes.
_Avoid_: account, user, persona — Profile is *facts about the candidate*, not a
login and not a Mode.

**Candidate Voice**:
A generated answer spoken in the candidate's own first person ("I built…"),
as opposed to a neutral assistant explanation.

**Resume**:
The candidate's uploaded CV, a Profile source (`profile_resume`).
_Avoid_: CV (in code), profile doc

**JD** (Job Description):
The description of the target role. **JD facts are role requirements, not
candidate claims** — the app must never present a JD requirement as something
the candidate has done.
_Avoid_: job post, role doc, target job (except the internal `target_job_evidence` tag)

**AnswerType**:
The classifier's label for what *kind* of answer a question needs
(e.g. `resume_jd_fit_answer`, `jd_requirements_answer`, `general_assistant`).
**AnswerType is not Source Ownership** — it describes the answer shape, not which
source is authorized to ground it.
_Avoid_: answer contract, question type — and never conflate it with Source Owner.

**Reference File**:
A PDF/DOCX/TXT the user attaches to a Mode as grounding material
(`mode_reference_file`).
_Avoid_: attachment, upload, document

## Context OS — source & evidence governance

**Context OS**:
The subsystem (`electron/intelligence/context-os/`) that governs which Sources
are allowed to enter a model call, and turns retrieved material into typed
Evidence. It is the authority on "who owns this answer".

**Turn**:
One request/response cycle — a single model call and everything authorized for it.

**Source**:
Anything that can inject content into a model call.

**Source Kind**:
The fine-grained category of a Source (e.g. `profile_resume`, `live_transcript`,
`prior_assistant_claim`, `browser_dom`). Capability grants differ per kind.
_Avoid_: source type, channel

**Source Owner** (a.k.a. **Source Authority**):
Who owns the answer for a turn — which source is authoritative. Decided by the
Mode Source Authority and the TurnContextContract, *not* by AnswerType.
_Avoid_: answer owner, source of truth

**Source Authority Kernel**:
The Context OS component that enforces Source Ownership and authorizes each
Source per turn.

**TurnContextContract**:
The typed per-turn contract that authorizes every Source entering the prompt and
carries the turn's memory-read policy. If a Source is not authorized by the
contract, it may not enter the prompt.
_Avoid_: turn config, prompt context

**Capability** (Source Capability):
A grant that permits a Source to be used as factual Evidence. No capability grant
⇒ no factual evidence from that source.
_Avoid_: permission, allowance

**Evidence**:
Typed source material that is authorized to *ground* a factual answer — as opposed
to instruction-only or referent-only material.

**EvidenceItem**:
A single unit of Evidence carrying source kind, source id, authority, trust
level, and scope id. Lexical/vector similarity alone never makes something
Evidence.

**EvidencePack**:
The governed set of EvidenceItems assembled for a turn and reused unchanged by
the post-stream validator (no second retrieval).
_Avoid_: context block, governed pack (say EvidencePack), prompt bundle

**Trust Level**:
How much a Source may be relied on — untrusted ambient capture (screen, browser
DOM) is data, never instructions.

**Provenance**:
The traceable origin (source id, timestamp, validation status) a piece of memory
must carry *before* it can become Evidence.

**Grounded** (Document-Grounded):
An answer is Grounded when it is derived from authorized Evidence. A
Document-Grounded Mode answers only from its Reference Files and must block
Profile, Hindsight, and prior-assistant facts.
_Avoid_: sourced, backed, cited

**Contamination**:
Content from an unauthorized Source leaking into an answer — e.g. a thesis
question answered from the candidate's resume. The failure mode Context OS
exists to prevent.
_Avoid_: leak, bleed, cross-talk

**Referent-only**:
A Source that may be *referred to* ("as I said before…") but is not factual
Evidence — the default status of prior assistant messages.

**Instruction-only**:
A Source that shapes style/behavior but is not factual Evidence — custom Mode
prompts and the Profile persona are instruction-only unless a trusted parser
converts them into Evidence.

## Knowledge, retrieval & memory

**OKF**:
The structured-knowledge subsystem (`electron/services/knowledge/`) that turns a
Reference File's content into verified Knowledge Cards and Packs, deterministically
(no LLM call). Treat "OKF" as a proper name for this subsystem.

**Knowledge Card / Knowledge Pack**:
A Card is one verified fact/section extracted from a Reference File; a Pack is the
set of Cards for one file, persisted and invalidated on content-hash change.

**EvidenceResolver**:
The unified retrieval pipeline (OKF → hybrid → lexical) that returns typed
Evidence. The target path all retrieval should converge on.

**ModeHybridRetriever**:
The legacy retrieval path still used by some surfaces (e.g. WTA's pre-provider
retrieval) pending migration to EvidenceResolver.
_Avoid_: the retriever, hybrid rag (be specific)

**Rolling Context**:
The bounded, moving window of the recent conversation kept for answer coherence.
_Avoid_: history, chat history, memory window, transcript buffer

**Meeting RAG**:
Retrieval over *past* meetings' transcripts stored in the local vector DB
("what did John say about the API last week?").

**Meeting Notes**:
The structured, per-template notes produced from a session (current schema V3).
_Avoid_: summary, minutes, Notes (say Meeting Notes; "Notes" alone means Custom Context)

**Hindsight**:
Long-term cross-session memory (optional local server). A Hindsight memory needs
Provenance and validation status before it can be Evidence, and is blocked in
Document-Grounded Modes.
_Avoid_: long-term memory (as a proper noun), recall

**Prior Assistant Message** vs **Prior Assistant Claim**:
A *Message* is what the assistant previously said (Referent-only). A *Claim* is a
fact extracted from an assistant answer, stored separately with a validation
status; only verified Claims may be reused as Evidence. Assistant text is never
Evidence by default.

**WTA** (WhatToAnswerLLM):
The sub-LLM that reads the live transcript and decides/streams the suggested
answer the user sees, as opposed to the manual-chat path.
_Avoid_: suggestion engine, auto-answer

**SessionTracker**:
The component that tracks the live session and compacts the transcript so it
stays bounded.
