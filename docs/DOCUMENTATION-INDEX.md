# Checkpoint — Documentation Index

This directory contains the detailed Phase 0 documentation.

## Start here

### 1. README.md
High-level introduction to the project.

### 2. 01-Product-Requirements.md
Explains what Checkpoint must do from the user's perspective.

### 3. 02-Vision-and-Goals.md
Explains why the product exists and what principles guide it.

### 4. 03-System-Architecture.md
Explains how the frontend, backend, engines and database fit together.

### 5. 04-Database-Design.md
Explains the tables, relationships and important database decisions.

### 6. 05-API-Specification.md
Defines how the frontend communicates with the backend.

### 7. 06-Authentication-and-Security.md
Explains users, roles, JWT, passwords and authorization.

### 8. 07-Question-and-Dataset-Specification.md
Defines the question formats and administrator dataset workflow.

### 9. 08-Review-Learning-Algorithm.md
Explains how Checkpoint decides when a question should return.

### 10. 09-XP-Level-Progression.md
Explains the XP economy, levels, promotion, demotion and streak bonuses.

### 11. 10-Frontend-Architecture.md
Explains the React structure and user interface behavior.

### 12. 11-Admin-Operations.md
Explains administrator workflows.

### 13. 12-Phase-0-Decisions.md
The consolidated D1–D15 decision register. This is the primary Phase 0 source of truth.

### 14. 13-Roadmap.md
Explains how implementation should proceed after Phase 0.

---

## Reading order

Someone new to the project should read:

```text
README
  ↓
Product Requirements
  ↓
Vision and Goals
  ↓
Phase 0 Decisions
  ↓
System Architecture
  ↓
Database Design
  ↓
API Specification
  ↓
Review Algorithm
  ↓
XP/Level Progression
  ↓
Frontend Architecture
  ↓
Admin Operations
  ↓
Roadmap
```

---

## Documentation rule

These documents should be updated whenever a locked architectural decision is intentionally changed.

Do not silently let the code and documentation diverge.
