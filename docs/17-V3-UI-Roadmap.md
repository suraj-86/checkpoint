# V3 UI Roadmap: Lavender Garden

Status: UI-1 to UI-6 and UI-8 are built and tested locally. UI-7 (polish) is in progress: sound, contrast, phone layout and keyboard checks are done; a final all-theme test pass and the push to production remain. Nothing is pushed online yet.

This replaces the earlier cyberpunk plan (docs/16-V2-UI-Design.md). The visual reference is the Lavender Garden preview designed by the project partner. It is an inspiration, not a spec: every screen is built on what our backend and frontend really have, and anything that needs new data adds that data in the same phase.

---

## 1. Ground rules

- Light and cute, not dark and neon. The Progress map lives in a lavender panel like everything else.
- The mascot is in. Its face doubles as the student avatar.
- Three themes, all done inside this effort: Morning (default, light lavender), Dawn (warm, softer), Night (dark).
- The XP system stays our own. Rewards never change how XP is calculated. A reward bonus shows up as its own line.
- No made-up numbers and no claims we cannot back. The preview's "Synced, offline ready" line is removed. Demo data never ships.
- Admin is designed in parallel with the student side in every phase, with the same palette and themes.
- Free-tier hosting only. Fonts come from Google Fonts (Fraunces for headings, Nunito for text).
- One phase at a time: design, approve, build, test, merge, then the next.

## 2. How each phase runs

1. **Design once.** I make an HTML preview page for the phase, in the Lavender Garden style, using real data shapes. It shows the student screens and the matching admin screens.
2. **Approve.** You and your partner review it. Changes happen here, before any app code.
3. **Build.** One zip per phase (backend, frontend, tests, migration if needed), with the usual test steps.
4. **Test and merge** by you. Then the next phase starts.

## 3. Themes

| Theme | Feel | Default for |
|---|---|---|
| Morning | Light lavender, soft sky gradient | New students, admin |
| Dawn | Warm cream and pink, softer contrast | Opt-in |
| Night | Deep violet, light text | Opt-in |

Themes are colour tokens only, so every component works in all three. The choice is saved per student (and per admin) so it follows them across devices, with the browser setting as a fallback until they choose.

## 4. Phases

Sizes: S small, M medium, L large.

### UI-1: Foundation and shells (L)

Everything else sits on this.

- **Student:** colour tokens, fonts, the three themes, a shared component kit (cards, buttons, chips, bars, pills, stat tiles, dialogs, toasts), the mascot component with moods, a calm background (soft gradient and gentle blobs, particles off by default), the Ctrl K jump-to menu, new sidebar and navigation, footer, and the login and register pages.
- **Admin:** the same shell with an "Admin console" marker, denser tables, same themes, no mascot chatter.
- **Backend:** V11 `user_settings` (theme, sound on or off).
- **Depends on:** nothing.

### UI-2: Home and Admin Dashboard (M)

- **Student:** the Home page in the new style (next mission, quests, stats, mastery summary, recent sessions, mascot greeting that reacts to your day).
- **Admin:** the dashboard (counts, question bank health, open requests) in the new kit.
- **Backend:** none expected.

### UI-3: Progress and Admin Catalog (L)

- **Student:** the knowledge tree (stream, subjects, topics) with topic labels always visible, a detail panel, and analytics cards built from real data:

| Card | Real data source |
|---|---|
| Accuracy trend, last 30 days | session answers by day (new endpoint) |
| Activity heatmap, 12 weeks | sessions by day |
| Accuracy by difficulty | answers joined to question difficulty (new endpoint) |
| Review queue and review forecast | real next-review dates |
| Weakest topics, topic radar | existing mastery data |
| Per-topic mastery history | accuracy per session per topic (new endpoint) |

- **Admin:** Streams, Exams, Subjects and Topics pages restyled, plus a tree view of the catalog.
- **Backend:** analytics endpoints. No migration.
- **Left out for now:** the "memory curve" prediction and "best time to study", because they would be guesses with the data we record today. Best time to study can come back after UI-4 starts recording answer times.

### UI-4: Practice and Admin Content (L)

- **Student:** practice hub with mode cards, the subject picker, the session screen (keys 1 to 4 to answer, skip, combo counter, optional "how sure are you?" and timing), and the results page (XP breakdown by performance band, level and streak bonus, "what moved in your tree").
- **Admin:** Upload, Datasets and Questions pages restyled, with a question preview that looks like the student view.
- **Backend:** V12 stores answer confidence and time taken. The session completion response gains the XP breakdown fields.
- **Depends on:** UI-1.

### UI-5: History, Profile and Admin Requests/Account (M)

- **Student:** the History calendar and list; Profile with stats, theme, sound, daily session size, "what I want to practise", and the study fingerprint (built from real topic mastery).
- **Admin:** Requests and Account pages restyled.
- **Backend:** V13 adds the daily session size setting to `user_settings` (validated range, for example 5 to 20).
- **Depends on:** UI-1.

### UI-6: Rewards (L)

Backend, student side and admin side together. Details in section 5.

- **Student:** chest inventory and opening animation, mascot skins, sticker collection, XP boosts, and a reward moment on the results page.
- **Admin:** Rewards manager.
- **Backend:** V14 rewards tables (items, student inventory, chests, boosts, odds, streak milestones) and the grant logic in session completion.
- **Depends on:** UI-4 (results page) and UI-5 (profile).

### UI-7: Polish and launch (M)

- Sound effects (generated in the browser, off by default).
- Accessibility pass: contrast in all three themes, keyboard use, reduced motion.
- Mobile pass for every screen, student and admin.
- Performance check of the background on older laptops.
- Empty and error states, docs and README update, deploy check on Neon, Render and Vercel.

## 5. Rewards system (draft)

### What can be earned

- **Mascot skins:** rare, change the mascot and the avatar.
- **Stickers:** common collectibles shown on the profile card.
- **XP boosts:** small, one active at a time.

### Where chests come from

1. **Session result.** Sessions with at least 10 answered questions, by performance band:

| Result | Chest |
|---|---|
| Good (75% or more) | Bronze |
| Excellent (90% or more) | Silver |
| Perfect (100%) | Gold |

   Limit: one session chest per day from the Daily Session, plus at most one more per day from Fast Practice, so Fast Practice cannot be farmed.

2. **Streak milestones.** One chest each time a milestone is first reached in a streak. The default milestones match the XP streak bonuses we already have: 3, 7, 14, 30, 60 and 100 days. Chest tier rises with the milestone. The list is editable by admin.

### Contents (rolled on the server when the chest is opened)

| Chest | Sticker | XP boost | Skin |
|---|---|---|---|
| Bronze | 70% | 30% | 0% |
| Silver | 55% | 35% | 10% |
| Gold | 40% | 30% | 30% |

If a category is used up (all stickers or all skins owned), the roll becomes an XP boost. Odds are editable by admin.

### XP boosts

- Types: +5 XP, +10 XP, +5%, +10%.
- Applied once, to the next session that ends with a positive XP change. A session that loses XP does not use it up and is not offset by it.
- A percentage boost is capped at +10 XP so the level curve stays fair.
- Shown on the results page as a separate "Boost" line. The normal XP calculation is untouched.
- Only one boost is active at a time. Extra boosts wait in the inventory.

### Safety rules

- Everything is decided on the server and granted in the same transaction as session completion.
- A grant is keyed by session or milestone, so refreshing or retrying can never double-grant.
- Opening a chest is an explicit action by the student.

### UI-8: Focus (M)

Added after UI-6. A self-study page with a large timer and a daily focus target.

- **Student:** a Focus page at `/focus`: a big HH:MM:SS timer in a progress ring toward the daily target (30 min, 1, 2, 3 or 5 hours, or a custom 15 to 720 minutes), Start, Pause and Stop, a 7-day bar chart and a focus-day streak.
- **How time is counted:** the page sends a heartbeat every 30 seconds while the timer runs and the tab is visible. The server credits only the gap between heartbeats, at most 90 seconds each, and at most 16 hours per day. A timer left running with the tab closed earns nothing.
- **Reward:** one chest per day, only after the day's total reaches the target. The target must be at least 30 minutes. Tier by target: Bronze under 2 hours, Silver 2 to under 5 hours, Gold 5 hours or more. It reuses the UI-6 chest system (source `FOCUS`, one per day).
- **Backend:** V15 `focus_days`, `focus_state`, `user_settings.daily_focus_minutes`, and the widened chest source check.
- **Left out:** the preview's Plan and Lab screens (no data behind them).

## 6. Backend additions

| Migration | Phase | Purpose |
|---|---|---|
| V11 | UI-1 | `user_settings`: theme, sound |
| V12 | UI-4 | Answer confidence and time taken |
| V13 | UI-5 | Daily session size setting |
| V14 | UI-6 | Rewards tables and seeds |
| V15 | UI-8 | Focus time per day, focus heartbeat state, daily focus target, `FOCUS` chest source |

Migrations never get edited after they are committed.

## 7. Admin panel plan

| Phase | Admin work |
|---|---|
| UI-1 | Shell, navigation, themes, shared table and form styles |
| UI-2 | Dashboard |
| UI-3 | Streams, Exams, Subjects, Topics, catalog tree view |
| UI-4 | Upload, Datasets, Questions, question preview |
| UI-5 | Requests, Account |
| UI-6 | Rewards manager: items, odds, streak milestones, granted and opened counts |
| UI-7 | Mobile and accessibility pass for admin |

## 8. Out of scope

- Offline mode, and any "offline ready" claim.
- The preview's invented numbers (+120 XP, 9-day streak, and so on).
- Memory-curve prediction until we record enough data to back it.
- Anything that changes the XP formulas.

## 9. Open decisions (recommended defaults)

1. **Streak chest days:** use the existing 3, 7, 14, 30, 60, 100, or your own list such as 5, 10, 20, 30, 50, 100? Default: the existing list, editable by admin.
2. **Fast Practice chests:** allowed, but one per day. Default: yes.
3. **Skin and sticker art:** who draws it? Default: I draw a starter set as simple SVGs (about 8 skins and 24 stickers) that your partner can refine or replace.
4. **Mascot in admin:** only in empty states and small spots. Default: yes.
5. **Sound:** generated in the browser, off by default. Default: yes.
6. **Default theme:** Morning for everyone. Default: yes.
7. **Optional extra, not planned:** a streak freeze or "XP shield" reward. Default: not now.

## 10. Risks

- The preview is one large hand-written file; porting it to React is real work, which is why it is split into seven phases.
- Reward odds and caps need tuning once real students use them, so they are admin-editable from day one.
- Three themes triple the contrast checking, so the checks happen in UI-1 and again in UI-7.
