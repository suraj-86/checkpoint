# XP and Level Progression

## 1. Why XP exists

XP is the student's main profile progression system.

It answers:

> "How far have I progressed overall?"

It does not answer:

> "Do I know this particular question?"

That second question belongs to the Review Engine.

---

## 2. XP is session-based

This is one of the most important decisions in Checkpoint.

We do not give XP like:

```text
Correct Q1 = +50
Correct Q2 = +50
...
```

Instead:

```text
Complete session
       ↓
Evaluate the whole session
       ↓
Calculate one XP change
```

This prevents extreme question-volume farming.

---

## 3. Difficulty weighting

The four difficulties have weights:

| Difficulty | Weight |
|---|---:|
| Easy | 0.80 |
| Medium | 1.00 |
| Hard | 1.25 |
| Expert | 1.50 |

These weights do not mean an Expert question simply pays 1.5 times XP.

They are used to normalize session performance.

---

## 4. Performance calculation

Suppose a session contains:

```text
5 Easy
3 Medium
2 Hard
```

Available weight:

```text
5 × 0.80
+ 3 × 1.00
+ 2 × 1.25
= 9.5
```

If the student correctly answers:

```text
4 Easy
3 Medium
1 Hard
```

earned weight:

```text
4 × 0.80
+ 3 × 1.00
+ 1 × 1.25
= 7.45
```

Performance:

```text
7.45 / 9.5 × 100
= 78.4%
```

So the student's session performance is approximately 78%.

---

## 5. Performance bands

| Performance | Band | Multiplier |
|---:|---|---:|
| 90–100% | Excellent | 1.00 |
| 75–89% | Good | 0.70 |
| 60–74% | Fair | 0.35 |
| 40–59% | Weak | -0.25 |
| 0–39% | Poor | -1.00 |

---

## 6. Level-specific XP

A beginner should progress faster.

As a student becomes more advanced, progression becomes harder.

| Level | Maximum Gain | Maximum Loss |
|---:|---:|---:|
| 1 | +100 | -10 |
| 2 | +90 | -12 |
| 3 | +80 | -15 |
| 4 | +70 | -18 |
| 5 | +65 | -20 |
| 6 | +60 | -22 |
| 7 | +55 | -24 |
| 8 | +50 | -26 |
| 9 | +48 | -28 |
| 10 | +45 | -30 |
| 11 | +42 | -30 |
| 12 | +40 | -32 |
| 13 | +38 | -34 |
| 14 | +35 | -35 |
| 15 | +33 | -36 |
| 16 | +31 | -37 |
| 17 | +29 | -38 |
| 18 | +27 | -39 |
| 19 | +26 | -40 |
| 20 | +25 | -40 |

The exact session result is calculated by applying the performance multiplier to the level's gain/loss range.

---

## 7. Example

A Level 5 student has:

```text
Maximum gain = +65
Maximum loss = -20
```

If performance is 80%:

```text
65 × 0.70 = 45.5
```

Rounded:

```text
+46 XP
```

If performance is 65%:

```text
65 × 0.35 = 22.75
```

Rounded:

```text
+23 XP
```

If performance is 30%:

```text
-20 XP
```

This makes poor performance matter without making normal mistakes catastrophic.

---

## 8. Level thresholds

| Level | Required XP |
|---:|---:|
| 0 | 0 |
| 1 | 1,000 |
| 2 | 2,500 |
| 3 | 4,500 |
| 4 | 7,000 |
| 5 | 10,000 |
| 6 | 14,000 |
| 7 | 19,000 |
| 8 | 25,000 |
| 9 | 32,000 |
| 10 | 40,000 |
| 11 | 49,000 |
| 12 | 59,000 |
| 13 | 70,000 |
| 14 | 82,000 |
| 15 | 95,000 |
| 16 | 110,000 |
| 17 | 127,000 |
| 18 | 146,000 |
| 19 | 167,000 |
| 20 | 190,000 |

A student starts at:

```text
0 XP
Level 0
```

They reach Level 1 at 1,000 XP.

---

## 9. Why Level 0 exists

Level 0 provides a meaningful first milestone.

A new account does not immediately claim Level 1.

The first 1,000 XP represents the student's initial progression.

---

## 10. Promotion

If total XP crosses a threshold:

```text
9,980 XP
+65 XP
=
10,045 XP
```

The student becomes Level 5.

The frontend can display:

```text
Level Up!
```

---

## 11. Demotion

Demotion works in the same way.

If a Level 5 student drops below 10,000 XP:

```text
10,000 XP → Level 5
9,999 XP → Level 4
```

There is no special demotion event that wipes progress.

The student simply moves to the highest threshold their current XP supports.

---

## 12. Level 20

Level 20 is the V1 maximum displayed level.

XP is not capped.

For example:

```text
215,000 XP
Level 20
```

This allows us to introduce higher levels later without redesigning XP storage.

---

## 13. Fast Practice XP

Fast Practice earns:

```text
25%
```

of the equivalent Daily Session XP value.

If Daily calculation would produce:

```text
+60 XP
```

Fast Practice produces:

```text
+15 XP
```

Positive Fast Practice XP is limited to:

```text
500 XP per day
```

After the cap, further Fast Practice can still:

- record attempts;
- update learning;
- affect statistics;

but cannot generate additional positive XP.

Negative XP can still apply.

---

## 14. Streak bonuses

Streak milestones provide bonus XP:

| Streak | Bonus |
|---:|---:|
| 3 days | +25 |
| 7 days | +50 |
| 14 days | +100 |
| 30 days | +200 |
| 60 days | +350 |
| 100 days | +500 |

Only the newly reached milestone pays.

For example, reaching 14 days gives:

```text
+100 XP
```

not 25 + 50 + 100.

---

## 15. Streak separation

Fast Practice cannot:

- start a streak;
- maintain a streak;
- trigger a streak bonus.

Only a qualifying Daily Session affects the streak.

---

## 16. Server authority

The frontend never tells the backend:

```text
"I earned +75 XP."
```

It only sends answers.

The backend independently calculates:

```text
performance
→ XP
→ total XP
→ level
```

This is essential for both correctness and security.
