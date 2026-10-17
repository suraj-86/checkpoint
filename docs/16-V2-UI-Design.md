# Checkpoint V2 UI Design (approved 2026-10-17)

The approved look is a soft cyberpunk learning game: rounded, calm neon on deep indigo, with a living background and a small mascot. The working reference page is `docs/design/v2-look-preview.html` (open it in a browser). Phase 5 builds this into the app, and Phases 6 to 8 use it from the start.

## Principles
- Game feel, not an exam portal: levels, XP, quests, badges, mascot reactions.
- Soft, not sharp: rounded corners, quiet borders, glows only as gentle shadows.
- Motion answers the user: hover lifts, bars fill, numbers count up, screens ease in. Nothing loops loudly. `prefers-reduced-motion` turns it all off.
- Every page is built from the same small set of components.

## Colour tokens
| Token | Value | Use |
|---|---|---|
| void | #0e0c1d | page background |
| deck | #13112a | surfaces behind panels |
| panel | #17142b | cards and panels |
| raised | #241f42 | chips, options, inputs, bar tracks |
| line | #322b5c | borders |
| text | #ece9ff | main text |
| dim | #9a95c4 | secondary text |
| cyan | #67e8f9 | primary accent, active nav, primary buttons |
| violet | #a78bfa | secondary accent, background |
| pink | #f472b6 | highlights, quest, mastered |
| amber | #fcd34d | XP, level, strong tier |
| mint | #6ee7b7 | correct, success |
| rose | #fb7185 | wrong, weak, errors |

Mastery tiers: Untouched #4a4188, Exploring #38b6cc, Learning cyan, Strong amber, Mastered pink.

## Type
- Display and body: Rubik (400, 500, 600, 700), Google Fonts.
- Numbers, codes and small data labels: JetBrains Mono (400, 600, 800), tabular numerals.
- Headings use balanced wrapping. Labels are small and dim, sentence case.

## Shape and surfaces
- Panel: radius 22px, 1px `line` border, soft drop shadow, faint top highlight. Pink and gold variants tint the border and shadow.
- Buttons are pills. Primary is a cyan gradient with a soft shadow, pink variant for the main call to action, ghost variant outlined. Hover lifts 2px.
- Chips, tier tags and world tabs are pills. Answer options and palette buttons are 14 to 16px radius.
- Progress and XP bars are rounded pills with a cyan to pink gradient and a slow shine sweep.

## Background (every page)
- Drifting blurred orbs in violet, pink and cyan.
- Faint dot lattice that fades toward the edges, plus a soft vignette.
- Constellation canvas: slow drifting dots joined by thin lines, nudged away by the pointer. Pauses when the tab is hidden, static with reduced motion, fewer dots on small screens.

## Sidebar (command rail)
- Brand at the top, then the mascot card, nav, then the level and XP bar on every page.
- Nav items: icon, label, rounded pill highlight on the active page with a thin cyan marker. Hover slides the item and tilts the icon. Practice shows a badge when something is waiting.
- Mascot "Bit": a small original robot. Moods are idle, happy, hype, sleepy and oops. It shows a speech bubble that reacts to nav hover, correct and wrong answers, combos, map clicks and stickers. It falls asleep after a while.
- Equipped stickers appear under the mascot.
- Phone width: the rail becomes a bottom bar with icons and labels and the mascot card is hidden.

## Screens
- **Home:** greeting, today's quest card, streak, accuracy and solved counters that count up, next-mission suggestion from weak topics, mastery ring, 14-day activity grid, shortcuts, rotating tips.
- **Practice session:** segmented charge bar for round progress, question panel, answer options, combo counter, floating "+10 XP" and "MISS" popups, explanation after answering, Skip, Next, numbered palette (correct mint, wrong rose, current cyan), Finish round.
- **Progress:** subject "worlds" as tabs, a topic map (nodes joined by lines). Each node shows a ring for percent explored, colour for tier, a red pulse when accuracy is low. Clicking a node opens a detail panel with explored and accuracy bars and a "Practice this topic" button. Tier legend underneath.
- **History:** filter chips and a list of session rows with score and XP.
- **Profile:** player card with avatar, rank title, level, XP to next level, XP bar, stream, exam and subject chips. Badges grid (earned and locked). Sticker bay where tapping equips or removes a sticker.

## Components to build in Phase 5
Theme tokens and base styles, Panel, Button (primary, pink, ghost), Chip, Tier tag, XpBar, ProgressRing, StatTile with count-up, Mascot with moods and bubble, Sticker and StickerBay, Badge, Nav rail and bottom bar, Background, Toast, Dialog (restyle ConfirmDialog), QuestionPalette restyle, ChargeBar, floating XP popup.

## Rules
- Free Google Fonts only, no new runtime libraries unless clearly needed. Plain SVG, CSS animation and small React components.
- Keep keyboard focus visible, keep text contrast readable, respect reduced motion, test at phone width.
- Sample data in the preview is placeholder. Real numbers come from the backend.
