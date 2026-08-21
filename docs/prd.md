# Product Requirements Document (PRD)
**Project Name:** Checkpoint (Placement Preparation Engine)
**Document Version:** 1.0.0

## 1. Project Objective
To develop a single-user, gamified Learning Management System (LMS) specifically optimized for technical interview preparation. The platform will leverage active recall and the Leitner spaced repetition system to help users master Data Structures, Algorithms, SQL, and core programming languages efficiently.

## 2. Target Audience
Primary users are undergraduate computer science students preparing for campus placements, requiring a structured, distraction-free environment to practice coding MCQs and concepts.

## 3. Scope of Version 1.0
**In-Scope:**
*   Role-based access control (1 Admin, Student defaults).
*   Admin dashboard for secure, drag-and-drop JSON dataset ingestion.
*   Spaced repetition algorithm (4-tier confidence buckets).
*   Dynamic rendering of multiple question types (MCQ, True/False, Fill-in-the-Blanks).
*   Daily session limits and streak tracking.

**Out-of-Scope (Deferred to V2):**
*   Global leaderboards and social sharing.
*   In-browser IDE/code execution sandboxes.

## 4. UI/UX Requirements
*   **REQ-U1:** The user interface must enforce a clean, personalized light theme utilizing subtle pinkish and reddish accents to minimize cognitive fatigue.
*   **REQ-U2:** Code snippets within MCQs must be rendered with proper syntax highlighting.