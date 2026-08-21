# 🚀 Checkpoint

A full-stack, single-user Learning Management System designed to gamify technical interview and placement preparation using active recall and spaced repetition (The Leitner System).

## 🛠 Tech Stack
*   **Backend:** Java 17, Spring Boot, Spring Security (JWT)
*   **Database:** PostgreSQL
*   **Frontend:** React.js, Tailwind CSS

## ✨ Key Features
*   **Spaced Repetition Algorithm:** Automatically schedules questions based on a 4-tier confidence bucket system.
*   **Unified Question Pool:** Mixes DSA, SQL, and language-specific questions into a single daily habit.
*   **Admin Data Ingestion:** Features a secure drag-and-drop dashboard to parse and validate bulk JSON question banks.
*   **Endless Practice Mode:** Uses algorithmic templates to generate dynamic questions when curated datasets run out.

## ⚙️ Local Installation & Setup
### 1. Database Setup
1. Create a PostgreSQL database named `checkpoint_db`.
2. Run the `schema.sql` file located in `backend/src/main/resources/` to build the tables.

### 2. Backend Setup
1. Navigate to the `/backend` directory.
2. Update the `application.properties` file with your local PostgreSQL credentials.
3. Run: `./mvnw spring-boot:run`

### 3. Frontend Setup
1. Navigate to the `/frontend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm start`