# Project Development Roadmap

## Phase 1: Planning & Infrastructure (Weeks 1 - 2)
*   Finalize all system documentation.
*   Initialize the Git repository.
*   Install and configure PostgreSQL locally.
*   Execute SQL scripts to generate the primary database tables.

## Phase 2: Backend Foundation & API (Weeks 3 - 4)
*   Initialize the Java Spring Boot application.
*   Configure the database connection and ORM.
*   Implement JWT-based Authentication.
*   Develop the Admin JSON parsing and ingestion service using Jackson.

## Phase 3: The Leitner Engine (Week 5)
*   Develop the core Java service layer to handle the spaced repetition logic.
*   Write SQL queries to fetch the daily queue based on `next_appearance` timestamps.
*   Implement the session loop logic (handling requeuing of incorrect answers).

## Phase 4: Frontend Implementation (Weeks 6 - 7)
*   Initialize React.js and configure Tailwind CSS.
*   Build the Admin UI (Drag-and-drop file uploader component).
*   Build the Student UI (Daily quiz interface, streak counters).

## Phase 5: Integration, Testing & Polish (Week 8)
*   Connect React frontend components to the Spring Boot REST APIs.
*   Conduct end-to-end testing of the session loop.
*   Record a demonstration video for project submission.