# Demo and Change Runbook

The assignment allows 10 minutes for the live demo. Use the same code and database setup you plan to submit; do not make unreviewed changes on presentation day.

## Before rehearsal or presentation

- Confirm the client and API start, the API health check succeeds, and Swagger opens at `/api/docs`.
- Check that the frontend points at the intended API and that the API connects to the intended Supabase project.
- Confirm the `covers` bucket is public and test one image upload. Do not show or share the service-role key.
- Confirm demo accounts and seed posts exist before the session. Use the account table in the root README; do not seed or reset the live/shared database during the demo.
- Open the live site and API health endpoint early. A free API host may need time to wake up.
- Keep the editor, feed, dashboard, admin page, and Swagger available in separate tabs. Use a phone-sized browser viewport for the feed.
- Keep the tested commit on `main` runnable and do not merge last-minute changes without reviewing and retesting them.

If a fresh local database is needed, use a disposable database and follow the README setup. `database/schema.sql` drops and recreates tables: never run it against the shared Supabase/demo database. Run API tests only against a disposable test database.

## Start the project locally

Open two terminals in the project root:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

The browser app is served at `http://localhost:5173`; the API and Swagger UI are at `http://localhost:4000` and `/api/docs`. The PostgreSQL database is configured through `backend/.env`.

## Ten-minute demo

| Time | Presenter | Show |
|---|---|---|
| 0:00-1:00 | Frontend | Open the feed at phone width; search, filter by a tag, and move between pages. Point out that filters are in the URL. |
| 1:00-3:00 | Frontend / Backend | Sign in as a reader; like a post and show the immediate update; add a comment and one reply. |
| 3:00-6:00 | Frontend | Sign in as an author; create a post, enter Markdown and show the preview, upload a cover, refresh to restore the draft, then publish. |
| 6:00-7:00 | Frontend | Open the author dashboard and show views, likes, and comment counts. |
| 7:00-8:00 | Backend | Show that an author cannot edit another author's post; explain that the API enforces ownership, not just the hidden UI button. |
| 8:00-9:00 | Backend / Database | As admin, change a user's role or moderate a comment. |
| 9:00-10:00 | Database / Backend | Open Swagger and show an endpoint request/response example, then show the passing test results. |

Use the demo accounts in the README and coordinate account hand-offs before the presentation. Do not change or expose a demo password during the talk.

## If something goes wrong

1. If the site is slow, open the health endpoint and live site early; wait for the API host to wake before starting the timed demo.
2. If the deployed API is unavailable, use the already-configured local client and API only if they are connected to a safe, disposable database. Do not switch the app to a production database just to rescue the demo.
3. If a feature fails, explain the expected behavior using the relevant screen and Swagger example, then continue to the next step. Be honest that the live action failed; do not present a screenshot as a working live feature.
4. Never run the schema script, bulk seed, or API test suite against the shared/live database during the presentation.

## Quick change map

When asked to adjust something, find the owner and make the smallest change at the correct layer. If the change affects an API request or response, update the OpenAPI example in the same pull request.

| Requested change | Start here | Verify with |
|---|---|---|
| Feed search, tag filter, or pagination | `frontend/src/pages/Feed.jsx`, `frontend/src/hooks/useDebounce.js`, `backend/src/routes/posts.js`, `backend/src/schemas.js` | Frontend tests; API tests on the disposable test database |
| Post fields or draft/publish behavior | `frontend/src/pages/Editor.jsx`, `backend/src/schemas.js`, `backend/src/routes/posts.js`, `database/schema.sql` if persistence changes | Frontend build and affected API tests |
| Who may edit, publish, or moderate | `backend/src/middleware/auth.js`, relevant `backend/src/routes/` file, `frontend/src/components/ProtectedRoute.jsx` | Role/ownership API tests |
| Like or comment interaction | `frontend/src/components/LikeButton.jsx`, `CommentSection.jsx`, matching route in `backend/src/routes/` | Component tests for optimistic update and rollback; affected API tests |
| Cover upload or storage | `frontend/src/pages/Editor.jsx`, `backend/src/routes/uploads.js`, `backend/src/utils/storage.js` | Upload with a safe test account and image |
| A documented endpoint change | `backend/openapi.yaml` | Open `/api/docs` and check request and response examples |
