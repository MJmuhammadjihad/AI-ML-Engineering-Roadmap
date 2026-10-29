# Edition 02 — 29 October 2026

## Curriculum and learning

- Expanded from 36 modules / 180 sessions to 41 modules / 205 sessions. New modules address algorithms and complexity, computer/network fundamentals, asynchronous JavaScript and TypeScript, controlled model adaptation, and mathematical research depth.
- Added 41 worked examples with expected outputs or invariants, downloadable source, and mechanism explanations. Added 41 misconception-focused diagnostic questions with reasoning and persistent attempt records. Correct-answer positions are balanced deterministically.
- Added prerequisite connections to every module. Reordered role routes so product-oriented learners encounter useful web work earlier. Removed unrelated LLM prerequisites from the general responsible-AI module and made research mathematics an explicit prerequisite for the research branch.
- Retained clear limits: planned hours are not measured learning averages, diagnostic success is not mastery, and current global hiring data remains incomplete because of network access restrictions.

## Design and interaction

- Rebuilt the overview with stronger typography, a three-step process panel, readable progress summaries, a next-action workbench and a six-stage journey.
- Added a capability map with prerequisite links, searchable command dialog (Ctrl/Cmd+K), and a focused lesson mode with previous/next navigation.
- Reworked cards, code examples, diagnostics, planner blocks, source entries and mobile layouts. The page remains a single offline-capable HTML file with system fonts and no external runtime dependencies.

## Planner and data integrity

- Added 45-, 60- and 90-minute focus blocks and a remaining-time breakdown by activity.
- Fixed daily schedules refilling after work was logged. The planner now subtracts logged activity time on that date and enforces the daily activity budget.
- Added loggable artifact-review time, repeat-review budgeting, and safe undo for consecutive time logs. Manual progress changes invalidate incompatible undo history so unrelated completion cannot be erased.
- Migrates edition-01 progress while retaining known sessions, notes and partial work. New prerequisite requirements can reopen mastery gates; this is explained in the interface.
- Strengthened imports and corrected HTML example downloads and embedded source-character preservation.

## Verification

21 browser tests passed. 38 worked examples passed execution checks; two were reviewed statically, and the PyTorch example remains unrun because PyTorch is unavailable. See `VALIDATION.md` for scope and artifact identity.
