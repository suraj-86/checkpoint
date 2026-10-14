# 14 — Deployment

Checkpoint runs on three free-tier services.

| Part | Service | Notes |
|---|---|---|
| Database | Neon (Postgres 17, Singapore) | Direct (non-pooled) connection; Flyway runs the migrations on startup |
| Backend | Render web service (Docker, Singapore) | Built from `checkpoint-backend/Dockerfile`; free instance sleeps after about 15 minutes idle |
| Frontend | Vercel (Vite) | Root directory `checkpoint-frontend`; `vercel.json` rewrites all paths to `index.html` |

Live site: https://checkpoint-blond-eta.vercel.app
API health check: https://checkpoint-api-j9ix.onrender.com/api/health

## Backend environment variables (Render)

| Variable | Purpose |
|---|---|
| `CHECKPOINT_DB_URL` | JDBC URL, e.g. `jdbc:postgresql://<host>/<db>?sslmode=require` |
| `CHECKPOINT_DB_USER` | Database user |
| `CHECKPOINT_DB_PASSWORD` | Database password (secret) |
| `CHECKPOINT_JWT_SECRET` | Random string of at least 32 characters used to sign login tokens (secret) |
| `CHECKPOINT_ADMIN_USERNAME` | Admin account created on first start if it does not exist |
| `CHECKPOINT_ADMIN_PASSWORD` | Password for that admin account (secret) |
| `CHECKPOINT_CORS_ORIGINS` | Comma-separated frontend origins allowed to call the API |
| `CHECKPOINT_LOG_LEVEL` / `CHECKPOINT_SQL_LOG_LEVEL` | `INFO` in production |

Each has a local development default in `application.yml`, so the app still runs locally with no variables set. The defaults are for development only. Never rely on them in production.

The admin account is only created when no user with that username exists. Changing `CHECKPOINT_ADMIN_PASSWORD` later does not change an existing admin; use the Account page instead.

## Frontend environment variable (Vercel)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL, no trailing slash |

Vite reads this at build time, so changing it needs a redeploy.

## Seeding questions

After the first deploy the database has no questions. Log in as admin, open Upload, and upload each file from `checkpoint-backend/sample-data`. Topics are created automatically.

## Keeping the free backend awake

An UptimeRobot HTTP(s) monitor pings `/api/health` every 5 minutes. `/api/health` is open to GET and HEAD requests without login.

## Operating notes

- The first request after a long idle period can take about 50 seconds while Render starts the instance.
- Pushing to `main` redeploys both the backend (Render) and the frontend (Vercel).
- Changing a Render environment variable restarts the backend.
- "Today" for the Daily Session resets at UTC midnight, which is 5:30 am IST.
- Changing a username logs that user out, because the login token is tied to the username.
- Deferred: email-based "forgot password" (free hosting blocks outbound SMTP).
