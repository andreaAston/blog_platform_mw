# Malawi Blog - Full-Stack React Blog Platform

ELE-IWS-521 (Internet and Web Services), BEng Electronics & Computer Engineering, MUBAS.
A blog with a **React** frontend, a **Node.js / Express REST API with JWT authentication**, and a **PostgreSQL database hosted on Supabase**.

| | Link |
|---|---|
| Live site (Vercel) | _Add after deployment_ |
| API (Vercel) | _Add public backend URL after deployment_ |
| API docs (Swagger UI) | `http://localhost:4000/api/docs` locally; add the deployed URL after deployment |
| Framework research | [`docs/FRAMEWORK_RESEARCH.md`](./docs/FRAMEWORK_RESEARCH.md) |
| Presentation (12 slides) | [Full-Stack React Blog Platform — Presentation.pptx](<./Full-Stack React Blog Platform — Presentation.pptx>) |
| Team ownership and workflow | [`docs/TEAM_PLAN.md`](./docs/TEAM_PLAN.md) |
| Demo and change guide | [`docs/DEMO_RUNBOOK.md`](./docs/DEMO_RUNBOOK.md) |

## Team

Put each member's name beside their workstream before submission. The folder ownership and three-member option are in [`docs/TEAM_PLAN.md`](./docs/TEAM_PLAN.md).

| Member | Workstream | Commits |
|---|---|---|
| _Name_ | Frontend - React UI, interactions and client tests | |
| _Name_ | Backend - Express API, authentication and API tests | |
| _Name_ | Database - PostgreSQL schema, constraints, seed data and data access | |

## Team collaboration (three members)

Use this repository as the team's **single source of truth**. Do not create another repository with empty placeholder files: the working frontend, backend, and database schema are already here.

### Give access and clone the repository

The repository owner invites the other two members as GitHub collaborators. Each member clones the same repository in the VS Code terminal:

```powershell
git clone https://github.com/andreaAston/blog_platform_mw.git
cd blog_platform_mw
git switch -c feature/short-description
```

Choose a descriptive branch name, such as `feature/feed-filter` or `fix/register-validation`. For an existing clone, update `main` before creating a new task branch:

```powershell
git switch main
git pull
git switch -c feature/short-description
```

### Agree on ownership

- **Frontend member:** primary owner of `frontend/`.
- **Backend member:** primary owner of `backend/src/` and `backend/openapi.yaml`.
- **Database member:** primary owner of `database/`, `backend/src/db.js`, and `backend/scripts/seed.js`.

The database and backend members agree before changing how an endpoint reads or writes data. The backend and frontend members agree on request and response shapes before changing the API contract. Keep one primary editor per file where possible, and review shared-file changes together.

### Set up local environments

Each member installs dependencies and creates their own ignored environment files:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Fill `backend/.env` with the database URL, SSL setting, and a private JWT secret. In a second terminal from the repository root, set up the frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
```

For local development, set `VITE_API_URL=http://localhost:4000/api` in `frontend/.env`. Use private local environment values; never share `.env` files or commit them. Only `.env.example` files with placeholders belong in Git.

Agree how the team will access PostgreSQL before testing. `database/schema.sql` drops and recreates tables, so never run it against a shared demo/production database. Run API tests only against a disposable database configured with `TEST_DATABASE_URL`.

### Run the app

Start the backend from `backend/`:

```powershell
npm run dev
```

Start the frontend in a second terminal from `frontend/`:

```powershell
npm run dev
```

Open the frontend URL printed by Vite (normally `http://localhost:5173`). Keep the hostname consistent with the backend's `CLIENT_ORIGIN`; `localhost` and `127.0.0.1` are different browser origins. The API health check is `http://localhost:4000/api/health`.

### Commit and open a pull request

Run the focused test or build for your change, then review what will be committed:

```powershell
git status
git add path\to\changed-file
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a Pull Request on GitHub into `main`. Explain the behavior changed, list the files touched, report checks run, and ask another member to review before merging. After merge, update local `main` before the next task. Avoid direct pushes to `main` and commits containing `.env`, credentials, `node_modules/`, or build output.

## Features

**Required**
- Register, login, logout - passwords hashed with bcrypt, JWT sessions, routes protected on the frontend *and* the API
- Three roles (reader, author, admin) - **enforced by the server**: an author can edit only their own posts; an admin can moderate any post or comment
- Posts: create, read, update, delete; Markdown editor with live preview; cover image upload; tags; draft / published
- Public feed with pagination, search, and tag filter
- Comments with one level of replies; admin moderation
- Likes - one per user per post, enforced by the database primary key
- Author dashboard: views, likes and comment counts per post
- Security: input validation (zod), sanitised Markdown (DOMPurify), login rate limiting, helmet headers, parameterised SQL

**Challenge features (3 implemented; the assignment requires at least 2)**
1. Automated tests - 16 API tests (Jest + Supertest) and 6 React component tests in 3 groups (Vitest + React Testing Library)
2. Optimistic updates with rollback - likes and comments
3. Draft autosave that survives a page refresh and a dropped connection

Count public deployment as a challenge feature only after both the frontend and API are publicly reachable and secrets are configured in the hosting environment.

**Built for phones and limited data:** mobile-first CSS, images resized to max 1200 px and converted to WebP on upload, native lazy loading,
pagination instead of loading every post, route-level code splitting, no web fonts.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    A[React SPA<br/>React Router, hooks, Context]
  end
  subgraph Vercel
    B[Express API<br/>helmet, CORS, rate limit<br/>JWT auth, role checks, zod]
  end
  subgraph Supabase
    C[(PostgreSQL)]
    D[Storage bucket: covers]
  end
  A -- "HTTPS + JSON<br/>Authorization: Bearer token" --> B
  B -- "SQL via pg (session pooler)" --> C
  B -- "service-role key (server only)" --> D
  A -. "loads images (public URL)" .-> D
```

## Database (ER diagram)

```mermaid
erDiagram
  USERS ||--o{ POSTS : writes
  USERS ||--o{ COMMENTS : writes
  USERS ||--o{ LIKES : gives
  POSTS ||--o{ COMMENTS : has
  POSTS ||--o{ LIKES : receives
  POSTS ||--o{ POST_TAGS : tagged
  TAGS  ||--o{ POST_TAGS : used
  COMMENTS ||--o{ COMMENTS : "replies (1 level)"
  USERS { int id PK
          text name
          text email UK
          text password_hash
          enum role }
  POSTS { int id PK
          int author_id FK
          text title
          text content
          enum status
          int view_count }
  COMMENTS { int id PK
             int post_id FK
             int user_id FK
             int parent_id FK
             text body }
  LIKES { int user_id PK
          int post_id PK }
  TAGS { int id PK
         text name UK }
  POST_TAGS { int post_id PK
              int tag_id PK }
```

Full SQL (tables, constraints, indexes, triggers, Row Level Security): [`database/schema.sql`](database/schema.sql).

## Who can do what

| Action | Anonymous | Reader | Author | Admin |
|---|:-:|:-:|:-:|:-:|
| Read published posts, search, filter | yes | yes | yes | yes |
| Like, comment, reply | - | yes | yes | yes |
| Delete own comment | - | yes | yes | yes |
| Create posts, upload images, dashboard | - | - | yes | yes |
| Edit / delete own post | - | - | yes | yes |
| Edit / delete **any** post, delete **any** comment | - | - | - | yes |
| See drafts of others, manage users and roles | - | - | - | yes |

## Run it locally

Requirements: Node.js 20 or newer, a Supabase account (free) _or_ a local PostgreSQL.

### 1. Database
1. Create a Supabase project. Click **Connect** and copy the **Session pooler** connection string
   (`postgres://postgres.<ref>:<password>@aws-...pooler.supabase.com:5432/postgres`). Use the pooler string: the direct connection is IPv6-only and fails on
   many home networks and on Render. See [Supabase docs](https://supabase.com/docs/guides/database/connecting-to-postgres).
2. Create the tables: paste `database/schema.sql` into the Supabase **SQL Editor** and run it (or run `npm run db:schema` in `backend/`).
3. Storage -> **New bucket** named `covers`, set to **public**.

### 2. API
```bash
cd backend
npm install
cp .env.example .env        # then fill in the values below
npm run seed                # demo users, tags, 5 posts, comments, likes
npm run dev                 # http://localhost:4000  (docs: /api/docs)
```

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Supabase session-pooler string (or `postgres://postgres:postgres@localhost:5432/blog_dev` locally) |
| `DATABASE_SSL` | `true` for Supabase, `false` for local Postgres |
| `JWT_SECRET` | Long random string (32+ chars). Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1d` |
| `CLIENT_ORIGIN` | Allowed browser origin(s), e.g. `http://localhost:5173` |
| `LOGIN_RATE_LIMIT` | Failed logins allowed per IP per 15 minutes (default 10) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | For image uploads. **Backend only - never put the service-role key in the frontend or in Git.** If empty, images are saved to `backend/uploads/` (development only). |

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:4000/api
npm run dev                 # http://localhost:5173
```

### Demo accounts (created by the seed script)

| Role | Email | Password |
|---|---|---|
| admin | admin@example.com | Admin12345 |
| author | chikondi@example.com | Password123 |
| author | thandiwe@example.com | Password123 |
| reader | mphatso@example.com | Password123 |

These are for local demos only. The seed posts are placeholders - **rewrite them in your own words** and add your own local topics.

### Tests
```bash
cd backend
npm test                  # API tests; use a disposable database
```

```bash
cd frontend
npm test                  # Component tests; no database needed
```

Run the API tests only with a disposable test database configured through `TEST_DATABASE_URL`; do not point tests at a production or shared demonstration database.

## Security notes (what protects what)

| Risk | Defence | Where |
|---|---|---|
| Stolen database leaks passwords | bcrypt hashes (cost 12), never plain text | `backend/src/routes/auth.js` |
| Guessing passwords | Login rate limit; same error for unknown email and wrong password | `auth.js` |
| Forged or stale roles | Role is re-read from the database on every request, not trusted from the token | `middleware/auth.js` |
| Author edits someone else's post | Ownership check on the server (UI hiding is only a convenience) | `routes/posts.js` |
| SQL injection | Parameterised queries (`$1`, `$2`) everywhere | all routes |
| Bad input | zod schemas validate every body and query string | `schemas.js`, `middleware/validate.js` |
| XSS through Markdown | Markdown -> HTML -> **DOMPurify** before display | `frontend/src/components/MarkdownView.jsx` |
| Double likes / deep reply chains | Database primary key and trigger, not just API checks | `schema.sql` |
| Supabase auto-REST exposing tables | Row Level Security on, no policies | `schema.sql` |
| Leaked secrets | `.env` files are git-ignored; `.env.example` has placeholders only | `.gitignore` |

Known trade-off: the token is kept in `localStorage` so it survives refreshes; this is simple but readable by injected scripts, which is why the XSS defences matter.
A production site might use an httpOnly cookie instead.

## Deploy (Vercel frontend and backend)

The frontend and Express API are separate Vercel projects connected to this repository. Set the **Root Directory** to `frontend` for the Vite app and `backend` for the Express API.

Set backend variables in the backend Vercel project only: `DATABASE_URL` (Supabase PostgreSQL connection string, preferably the Session pooler), `DATABASE_SSL=true`, `JWT_SECRET`, and `CLIENT_ORIGIN` (the exact public frontend origin). For image uploads, also set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET=covers`. Never put backend secrets in the frontend project.

Set `VITE_API_URL=https://<public-backend-domain>/api` in the frontend Vercel project. If Deployment Protection requires visitors to log in to Vercel to reach the backend, browser requests from the public frontend will fail; make the production API deployment publicly accessible. After environment-variable changes, redeploy the affected project. Verify `https://<public-backend-domain>/api/health` returns `{"status":"ok"}` and add the public site/API links to the table at the top.

Do not run the destructive schema script or seed command against a shared production/demo database unless the team has explicitly agreed and taken precautions.

## Project structure

```
frontend/  React app and client tests (src/pages, src/components, src/hooks, src/context, src/__tests__)
backend/   Express API, API tests, seed script and OpenAPI contract (src/routes, src/middleware, tests/)
database/  PostgreSQL schema (tables, indexes, constraints, triggers and RLS)
docs/      Team ownership, demo runbook and framework research
root       README.md and presentation materials
```

### Team ownership (three members)

- **Frontend member:** owns `frontend/`. Build screens and interactions against the API contract; run `npm test` and `npm run build` from `frontend/`.
- **Backend member:** owns `backend/src/` and `backend/openapi.yaml`. Implement and test HTTP endpoints; run `npm test` from `backend/`.
- **Database member:** owns `database/`, `backend/src/db.js`, and `backend/scripts/seed.js`. Maintain schema, constraints, seed data, and the SQL connection layer. Coordinate schema/API changes with the backend member before merging.

Each member should work on a separate branch, agree on API and schema changes before parallel edits, and keep the shared demo database safe. For a live change, start the API and frontend in separate terminals from their folders; the database is a shared service configured by the backend `.env`, not a third app server.

## Credits and AI use

_Fill this in honestly - the assignment requires citing AI tools and tutorials, and every member must be able to explain every line they submit._

- AI assistant used for: _e.g. first draft of the project structure, schema, API and tests; we then read, changed and ran everything ourselves._
- Tutorials / docs used: see the reference list in `docs/FRAMEWORK_RESEARCH.md`.
- Libraries: express, pg, jsonwebtoken, bcryptjs, zod, helmet, cors, express-rate-limit, multer, sharp, @supabase/supabase-js (Storage only), swagger-ui-express, react, react-router-dom, marked, dompurify, vite, jest, supertest, vitest, @testing-library/react.
