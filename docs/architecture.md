# System Architecture Specification

## 1. High-Level Overview
Checkpoint operates on a decoupled client-server architecture. The frontend (React.js) handles all user interactions and state management, while the backend (Java Spring Boot) manages business logic, dataset parsing, and algorithmic spaced repetition.

## 2. Component Interaction Flow
1. **Client Layer:** React.js Single Page Application (SPA).
2. **Transport Layer:** RESTful HTTP/HTTPS requests containing JSON payloads.
3. **Application Layer:** Java Spring Boot application exposing API endpoints.
4. **Persistence Layer:** PostgreSQL relational database.

## 3. The Spaced Repetition Engine (Leitner System)
The core backend service evaluates user responses to modify question visibility:
* **Level 0 (New/Failed):** Enqueued immediately in the current or next daily session.
* **Level 1 (Familiar):** Timestamp `next_appearance` set to `current_date + 2 days`.
* **Level 2 (Confident):** Timestamp `next_appearance` set to `current_date + 5 days`.
* **Level 3 (Mastered):** Timestamp `next_appearance` set to `current_date + 14 days`.

## 4. UI/UX Design Philosophy
The user interface avoids heavy, dark aesthetics to reduce cognitive fatigue during intense study sessions. The frontend utilizes Tailwind CSS to implement a personalized, clean light theme with subtle pinkish and reddish accents, ensuring a welcoming and focused learning environment.