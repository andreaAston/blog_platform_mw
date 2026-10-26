# Team Plan - Full-Stack React Blog

The project is divided into three independently owned areas so each of the three members can work in parallel:
**frontend**, **backend**, and **database**. The database is a PostgreSQL service, not a separate app process.

Deadlines: **GitHub 5 Nov 2026, 11:59 PM** (tag the final commit `final-submission`). **Presentation and demo 6 Nov 2026** (25 min: 10 present, 10 demo, 5 questions).
Demo exactly the code you submit on the 5th.

## Ownership

Each member is the primary editor for their area. Agree on API and schema changes before changing the contract between areas.

| Member role | Primary ownership | Must be able to explain |
|---|---|---|
| Frontend | `frontend/` - pages, components, hooks, auth context, API client, styles and component tests | React components and state, routing, form flows, Markdown sanitising, optimistic updates, autosave and client tests |
| Backend | `backend/src/` and `backend/openapi.yaml` - Express app, routes, auth, validation, middleware and API tests | request flow, JWT and role checks, ownership rules, validation, SQL calls, HTTP status/error responses and API examples |
| Database | `database/`, `backend/src/db.js`, `backend/scripts/seed.js` - schema, constraints, indexes, triggers, RLS, connection and demo data | table relationships, constraints, transactions, triggers, safe schema changes, seed workflow and how API queries map to tables |

The database member owns schema changes, while the backend member owns route behavior. When a route needs new or changed data, agree on the SQL/schema contract first, then coordinate the change and review each other's work. The same applies when a UI change requires an API request or response change.

## Working agreement

1. Read your assigned files and trace at least one request from the screen through the API to the database.
2. Work on short-lived branches, such as `feature/reader-auth` or `feature/comment-replies`; keep `main` runnable.
3. Keep one primary owner per file. Tell that owner before editing their files; avoid unrelated rewrites in a shared file.
4. Agree on endpoint names, request/response shapes and role rules before frontend and backend work proceed in parallel. Update `backend/openapi.yaml` with an API change in the same pull request.
5. In each pull request, explain the behavior changed, list the files touched, and report the focused test/build command and result. Ask another member to review it.
6. Make changes you understand and can demonstrate. Fill in the README team names and credits/AI-use note truthfully.
7. Make at least **5 meaningful commits per member**, with messages that explain the change (for example, `add login rate limit`).
8. Do not put `.env` files, tokens, database URLs, or service-role keys in GitHub, screenshots, slides, or commits. Each person uses their own ignored `.env`.
9. `database/schema.sql` drops and recreates tables. Never run it on the shared demo or production database. Run API tests and schema changes against a disposable test database.

## Local workflow

- The database member sets up PostgreSQL/Supabase and configures `backend/.env`.
- Start the API in one terminal from `backend/` with `npm run dev`.
- Start the browser app in another terminal from `frontend/` with `npm run dev`.
- Keep the API contract in `backend/openapi.yaml` aligned with frontend requests. The frontend uses `VITE_API_URL`; the API uses `CLIENT_ORIGIN`.
- Run client tests/build from `frontend/`; run API tests from `backend/` only with `TEST_DATABASE_URL` pointed at a disposable database.

Everyone should be able to explain the whole data flow (browser -> API -> database), even though each member owns a smaller area.

## Timeline

| Dates | Goal |
|---|---|
| 12-18 Oct | Everyone runs the project locally. Learn React with the cheat sheet (components, props, state, effects). Set up Supabase, agree API endpoints, create the GitHub repo and branches. |
| 19-25 Oct | Each member reads and modifies their part, commits daily. Seed your own local-topic posts. Login -> feed -> one post works on every laptop. |
| 26 Oct - 1 Nov | Finish features and challenge features. Write the research slides in your own words. Deploy API (Render) and frontend (Vercel). |
| 2-4 Nov | Freeze features. Test on a phone and a slow connection. Rehearse the demo on the laptop and network you will use. Fix the README. |
| **5 Nov** | Final check, tag `final-submission`, submit before 11:59 PM. |
| **6 Nov** | Present. Open the live site 10 minutes early to wake the free Render server. |

## Demo script

Follow [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md) for preflight checks, the timed sequence, fallback steps, and where to start when a change is requested during rehearsal.

## Likely viva questions

1. Walk through what happens, step by step, from clicking "Log in" until the feed shows your name.
2. Why do we hash passwords, and why bcrypt? What does the "cost" number do?
3. What is inside a JWT? Why is it safe to send but not safe to trust blindly? Why do we re-read the role from the database?
4. A student edits the frontend to show the Edit button on someone else's post and clicks it. What happens, and which backend check stops it?
5. What does `useEffect` do, and what is the dependency array for? What happens if you forget it?
6. Explain `useDebounce` line by line. What is the cleanup function for?
7. What is the virtual DOM? What does React do when you call `setState`? Why do list items need a `key`?
8. Why is data one-way in React? How does a child tell its parent something happened?
9. Explain the optimistic like: what do we remember, when do we roll back, and why is `busy` a ref and not state?
10. Why does the feed keep `page`, `q` and `tag` in the URL instead of only in state?
11. What stops a user liking twice? What stops a reply to a reply?
12. How is Markdown sanitised and why? What would happen without DOMPurify?
13. Why use a SQL transaction when creating a post with tags?
14. Why use Supabase's session pooler string rather than the direct connection?
15. What would you change first if 10,000 people used the site?
16. When would you not use React?
