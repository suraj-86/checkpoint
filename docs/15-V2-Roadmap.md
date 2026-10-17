# Checkpoint V2 Roadmap

Each phase lives on its own git branch, started from `main` after the previous phase is tested, pushed and merged. Production (Render and Vercel) deploys from `main` only, so nothing here touches the live site until you merge. One phase at a time: test, commit, push, merge, then the next.

Rules for every phase: backward-compatible database migrations only (new tables or nullable columns, never edit a migration after it has been applied), backend tests updated, and a step-by-step test checklist delivered with the zip. Migration files are not edited after commit, because Flyway checksums them.

## Status

| Phase | Branch | Scope | State |
|---|---|---|---|
| 1 | `v2/p1-username` | Username saves, live availability check, rules, 7-day cooldown | Merged |
| 2, 2b | `v2/p2-session-history` | Session detail page; History menu with search and filters | Merged |
| 3, 3b | `v2/p3-session-navigator` | Question palette, Previous/Next/Skip/Submit, Fast skipped pool, Daily unattempted scoring, hidden answers for skipped questions, styled confirm dialog | Merged |
| 4a | `v2/p4a-catalog` | Catalog backend and admin catalog page | Planned |
| 4b | `v2/p4b-admin-hierarchy` | Admin upload, question browser, dataset pages use the hierarchy | Planned |
| 4c | `v2/p4c-student-hierarchy` | Profile preferences, Fast Practice cascade, Daily from preferences, History Subject filter | Planned |
| 5 | `v2/p5-cyber-ui` | Cyberpunk game design system, animated sidebar with mascot, every page re-themed | Planned |
| 6 | `v2/p6-progress-map` | Progress page: mastery map and interactive analytics | Planned |
| 7 | `v2/p7-home` | Dashboard renamed Home: quests, suggestions, shortcuts | Planned |
| 8 | `v2/p8-help-contact` | Help and Contact page, FAQ, "what do you want to practice" form | Planned |

The look is approved (2026-10-17). Reference: `docs/16-V2-UI-Design.md` and the interactive page `docs/design/v2-look-preview.html`. Phases 5 to 8 follow it.

## Phase 4: Catalog hierarchy (Stream, Subject, Topic, Exam)

### Model

```
Stream <--many-to-many--> Subject <--many-to-many--> Exam
                             |
                           Topic   (belongs to exactly one Subject)
                             |
                     Questions and datasets
```

Decisions:
- Subject is the centre. Questions live in a Topic, a Topic belongs to one Subject, so nothing is ever duplicated (Maths is stored once and shared by PCM, Commerce, JEE, CUET, NIMCET).
- Stream to Subject is many-to-many. Subject to Exam is many-to-many.
- Exam to Topic links are never built. Level is handled by difficulty and by choosing specific topics (a boards student picks the topic and Easy).
- Only the stream "Computer Science" is seeded. The admin adds Streams, Subjects, Topics and Exams later from the admin panel.
- Existing data: every current topic (Java, Python, DSA, SQL, C, JavaScript, Git/Linux, OS, Networks and so on) becomes a Subject linked to the stream Computer Science, each with one default Topic. No question, session or history is lost, and old attempts keep working.
- Deleting a Subject or Topic is blocked while it has active questions. Removing a link never deletes questions.

### 4a: Catalog backend and admin catalog
- New tables: streams, subjects, topics, exams, stream_subjects, subject_exams (Flyway V7). Existing topic data is migrated into subjects and default topics.
- Compatibility: existing question and session code keeps working during the transition.
- Admin Catalog page: create, rename, reorder, retire Streams, Subjects, Topics, Exams, and tick which Streams and Exams each Subject belongs to.
- Student pages unchanged.

### 4b: Admin upload, browser and dataset pages
- Upload page: pick Stream, then Subject, then Topic (or create one inline), then drop the JSON file. The dataset JSON format stays unchanged.
- Question browser and Dataset history: Stream, Subject, Topic filters; retire, restore and delete keep working.

### 4c: Student side
- Profile: remove the old interests list. Add preferred Streams or Exams, then Subjects, then Topics or chapters (dropdowns and chips). Old interests are migrated into topic preferences where they match.
- Daily Session is built from the preferred Topics, weighted towards weaker topics, still fixed at 10 questions with the existing scoring rules.
- Fast Practice: UI only. Cascade Stream, Subject, Topic (multi-select), plus difficulty and type as today. If a stream is saved in Profile it is preselected, with an "all subjects" switch.
- History: add the Subject filter (and Stream).
- Progress and the rest keep working with the hierarchy; the visual rework comes in Phase 6.

## Phase 5: Cyberpunk game design system

Direction (from the request): a full cyberpunk learning-game identity, not a dark mode. Applies to every page and component.

- Look: neon cyan, magenta and yellow on deep-space panels; angled "notched" HUD frames instead of rounded cards; scanline and grid backgrounds; glitch effect on hover; techno display font for headings, mono font for numbers (free Google Fonts); counting numbers, panels that slide in, buttons that charge up.
- Sidebar: glowing command rail. Nav items are nodes that light up with a neon trace on the active page. A mascot character (original design) lives in the sidebar with moods and emotes (idle, happy, hype, sleepy), reacts to hover, correct answers, streaks and level-ups, and shows stickers and small speech bubbles. Level, XP bar and streak sit at the bottom on every page.
- Profile: a full player card with avatar, level, rank title, XP to next level, streak, badges, equippable stickers. Animated progress bars for XP and levels.
- Practice sessions: a charge bar for progress through the questions, distinct correct and wrong effects, combo streaks, a "mission complete" results screen with XP flying into the bar. The question palette and confirm dialog adopt the theme.
- Shared building blocks: theme tokens, HUD panel, neon button, XP bar, stat tile, badge, sticker, dialog, toast, page transitions, reduced-motion support, keyboard focus states, readable contrast.
- No new runtime libraries unless clearly needed. Plain SVG, CSS animation and small React components.
- Look approved: see `docs/16-V2-UI-Design.md`. The phase is delivered in one zip, tested on desktop and phone width.

## Phase 6: Progress page (mastery map)

- Topic-wise mastery, not line charts. Each Subject is a "world", each Topic a node on a map. Click a Subject, its topic nodes light up and fill.
- Per topic: Explored (distinct questions attempted out of questions in the topic), Accuracy (first-attempt correct rate), and a tier: Untouched, Exploring, Learning, Strong, Mastered. Example: Maths, Sets and Relations, 70% explored, 85% accurate.
- Other pieces: subject radar, activity streak grid, XP and level bars, rank-ups with a small celebration, "weakest three topics" targets with a Practice button that starts a session on that topic, badges.
- Keeps Session history links and the Search all history link.
- Needs one backend progress endpoint for per-topic stats (read only, no schema change expected).

## Phase 7: Home (renamed from Dashboard)

- Route and sidebar label become Home (old /dashboard redirects).
- Today's quest (Daily Session) with streak, a next-mission suggestion from weak topics, quick-launch shortcuts (Fast Practice on a favourite topic, resume session, History), mastery ring, XP and level, a few playful touches (rotating tips and mascot messages).
- Interactive visuals instead of simple line charts.

## Phase 8: Help and Contact

- Help and Contact page with FAQ, contact details, and a "what do you want to practice" form (stream, exam, subject, free text) saved to the database and listed for the admin.
- Built in the Phase 5 theme.

## Deferred, not part of V2
- Email forgot-password.
- Datasets: Java toward 2,000 questions, new Subjects and exam content once the catalog exists (uploaded through the Phase 4b upload page).
- Neon storage check once the question bank grows.

## Open points to confirm as we go
- Mascot is "Bit" (approved in the preview).
- Rank titles and level names.
- Exact mastery thresholds for the five tiers (set in Phase 6, can be tuned).
