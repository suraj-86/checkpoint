# Checkpoint V2 Roadmap

Each phase lives on its own git branch, stacked on the previous one (phase 2 starts from the phase 1 branch, and so on). Production (Render and Vercel) deploys from `main` only, so nothing here touches the live site until you merge.

| Phase | Branch | Scope | Request items |
|---|---|---|---|
| 1 | `v2/p1-username` | Username actually saves; live "already taken" check on Register and Profile; rules (3-20 chars, letters/numbers/dot/underscore, no spaces, reserved names, case-insensitive uniqueness); rate limit on the check; 7-day change cooldown | 1, 2, 3 |
| 2 | `v2/p2-session-history` | Session detail page: every question with your answer, the correct answer, right/wrong marking and explanation; linked from Progress > Session history; Revise button | 4 |
| 3 | `v2/p3-session-navigator` | Practice session: Next, Previous, Skip, Submit session, and a numbered question palette (answered, skipped, not visited); fast practice requeues skipped questions; daily session scores unattempted as unattempted | 5, 6 |
| 4 | `v2/p4-subjects` | Subject > Topic layer (Computer Science now; Maths, Physics, Chemistry, Biology later for JEE/NEET) | 8 |
| 5 | `v2/p5-help-contact` | Help and Contact page, FAQ, "what do you want to practice" request form | 7 |
| 6 | `v2/p6-game-ui` | Game feel: new design system, animated sidebar, dashboard renamed Home with more analytics | 9, 10, 11 |

Rules for every phase: backward-compatible database migrations only (new tables or nullable columns), backend tests updated, and a step-by-step test checklist delivered with the zip.

## Status
- Phase 1: tested and working.
- Phase 2: delivered, awaiting test.
