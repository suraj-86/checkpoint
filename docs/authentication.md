# Authentication and Security Protocol

## 1. Strategy: Stateless JWT Authentication
To allow seamless communication between the React frontend and Java backend, the system utilizes JSON Web Tokens (JWT). The server does not store session states, ensuring high performance.

## 2. Authentication Flow
1. **Login:** The user submits credentials (username/password) via React.
2. **Verification:** Spring Boot queries the `users` table and verifies the password hash using the `BCrypt` algorithm.
3. **Token Generation:** If valid, Java generates a JWT containing the user's `id` and `role` (Admin or Student), signed with a secret key.
4. **Storage:** React receives the JWT and stores it securely in `localStorage` or `sessionStorage`.
5. **Subsequent Requests:** Every time React requests data (e.g., pulling a daily quiz), it attaches the JWT in the `Authorization` HTTP header. 

## 3. Role-Based Access Control (RBAC)
* **Student Endpoints:** `/api/practice/**`, `/api/profile/**`
* **Admin Endpoints:** `/api/admin/**` (Spring Security will reject any JWT that does not explicitly contain the 'ADMIN' role).