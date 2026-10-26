# Part 1 - Framework Research

> Draft prepared as a starting point. **Rewrite the explanations in your own words before the presentation** - the
> numbers, measurements and links below are real, but your wording and your recommendation must be yours.
> Researched October 2026. Re-check the "live" numbers (job boards, survey) shortly before presenting and note the date.

## 1. What we compared

React, Angular, Vue, Svelte, and Next.js (a framework built on React). We chose these because they are the
ones most developers mention, and because Next.js lets us talk about server-side rendering honestly.

## 2. Comparison table

| | **React** | **Angular** | **Vue** | **Svelte** | **Next.js** |
|---|---|---|---|---|---|
| **How it updates the page when data changes** | Re-runs the component function, builds a new tree of lightweight objects (the virtual DOM), compares it with the previous tree (reconciliation) and changes only the real DOM nodes that differ. | Change detection re-checks template bindings. Default projects load *zone.js*, which tells Angular when async work (clicks, timers, requests) finished; *signals* allow finer-grained updates. | A reactivity system (JavaScript Proxies) records which state each component reads; when that state changes, only those components re-render. Also uses a virtual DOM, optimised by its template compiler. | A compiler turns components into plain JavaScript that updates exactly the DOM nodes affected by a change. No virtual DOM; Svelte 5 uses "runes" such as `$state`. | Same as React in the browser. Adds routing, server rendering and static generation on top. |
| **Learning curve and tooling** | JSX + hooks are the main ideas. Needs a build tool (we use Vite) and add-on libraries (router, etc.), so you make more choices. | Steepest: TypeScript, dependency injection, RxJS, its own CLI and project structure. Very complete and opinionated. | Gentle: single-file components with template, script and style together. Vite-based tooling. | Smallest syntax to learn; SvelteKit adds routing/server features. | Needs React first, then routing conventions and server/client component rules. |
| **Community and work** | Largest by survey usage (see section 3). Most tutorials, libraries and answers. | Large, strongly enterprise-oriented. | Large, popular with smaller teams and agencies. | Smallest of the five but highly liked in surveys; fewer jobs. | Very widely used for production React sites. |
| **Download weight, starter app, gzip JS** (measured, section 4) | **69.3 kB** | **69.6 kB** (incl. zone.js polyfills) | **25.3 kB** | **12.4 kB** | not measured |
| **Normally used for / by** | Interactive UIs and single-page apps. Created by Meta. | Large business applications and dashboards. Created by Google. | Interactive UIs, progressive adoption into existing pages. Independent open source project. | Small, fast sites and widgets; also full apps via SvelteKit. | Content-heavy sites, e-commerce, apps that need SEO and fast first load. Made by Vercel. |

## 3. Community size and jobs (including Malawi and the region)

**Worldwide usage - Stack Overflow Developer Survey 2025, "Web frameworks and technologies"** (share of all respondents who
did extensive work with it in the past year; 23,678 respondents answered this question):

| Technology | All respondents | Professional developers |
|---|---|---|
| React | 44.7% | 46.9% |
| Next.js | 20.8% | 21.5% |
| Angular | 18.2% | 19.8% |
| Vue.js | 17.6% | 18.4% |
| Svelte | 7.2% | 6.9% |

The same survey also shows PostgreSQL as the most used database (55.6% of all respondents) and the one developers most want to keep using,
which supports our database choice (Supabase is hosted PostgreSQL).

**A warning about npm download numbers.** Different websites quote very different weekly npm downloads for React (tens of millions
to over a hundred million). Because the sources disagree so much, we do not quote a number. If you want one, open npmtrends.com yourself,
screenshot it, and record the date.

**Malawi and the region - honest findings (thin evidence):**

- A search on PNet (a South African job board) for ReactJS jobs in Malawi showed **0** matching jobs when we looked. PNet is mostly a South African site, so this is a weak sample, not proof that no jobs exist.
- A software-engineer advert from IDIAS (Lilongwe) asked for experience with "various technologies" and listed PHP, C#, .NET, Laravel, Java, ReactJS, VueJS, AngularJS and jQuery, plus PostgreSQL among databases. The advert's deadline was in October 2025, so it is a year old. Takeaway: local employers tend to list many technologies, and React is one of several.
- Remote work for international companies is a more realistic route to React jobs from Malawi than local postings.

**To do before presenting (15 minutes):** search LinkedIn and the local job boards you know for "React", "Angular", "Vue", "PHP" and "Laravel" in Malawi, write down the counts and the date.
Our recommendation should rest on evidence you collected yourselves.

## 4. Download weight - how we measured

We created a starter app with each tool's official generator, built it for production, and recorded the gzip-compressed JavaScript size
(what a phone actually downloads). Tools: `create-vite` (Vite 8.3) for React 19.2, Vue 3.5 and Svelte 5.57; Angular CLI 20 (Angular 20.3) for Angular
(the newest Angular CLI needs a newer Node.js than our test machine had, so we used version 20; Angular reports an "estimated transfer size").

| Starter app | Gzip JavaScript |
|---|---|
| Svelte 5.57 | 12.4 kB |
| Vue 3.5.42 | 25.3 kB |
| React 19.2.8 | 69.3 kB |
| Angular 20.3 (main 58.2 + polyfills 11.3) | 69.6 kB |

Limits of this test: starter templates contain only a counter/hello page; real apps grow; Angular was measured with a different tool.
Use it for the *relative* picture, not as an exact benchmark.

**Our own app:** the main JavaScript bundle is about **87 kB gzip**. The Markdown libraries (`marked`, `DOMPurify`, about 25 kB gzip) and
the editor, dashboard and admin pages are split into separate files that only download when opened (`React.lazy`). Images are resized to
1200 px wide and converted to WebP on upload, and lazy-loaded in the browser.

## 5. Our recommendation (edit this into your own voice)

**Why React suits our blog.** The interesting parts of this blog are interactive: a Markdown editor with live preview, likes and comments that
appear instantly, a dashboard, role-based screens. React is built for exactly this: the screen is a function of state, so when a like count changes
we change one number and React updates the page. React also has the largest community, so when we are stuck there is an answer, and the skills
transfer to jobs and to React Native later.

**When we would not use React.** For a mostly-static blog or a company marketing site where nobody logs in, a plain static site or a
content-first tool such as Astro (or server-rendered HTML) would load faster on a slow connection and be easier for search engines to read.
Our blog is a client-side single-page app, so Google and social-media link previews first receive an almost empty HTML page; for a
public blog that needs search traffic we would move to Next.js or add pre-rendering. We chose a client-side app here because the assignment
asks for a React frontend talking to a separate Express API.

**What EJS and jQuery struggle with that a framework handles better.**

- *Keeping the screen and the data in sync.* With jQuery you change the DOM by hand after every event; forget one place and the page shows stale data. In React you change the state and the UI follows.
- *Reusing pieces.* An EJS partial is text pasted into a page; a React component bundles markup, behaviour and state, takes inputs (props), and can be reused and tested alone.
- *Page reloads.* EJS renders on the server and usually reloads the whole page for every action; a React app fetches JSON and updates only what changed, which is faster and uses less data.
- *Growing complexity.* jQuery code that toggles classes and reads values from the DOM turns into tangled event handlers as features grow; the one-way data flow in React keeps changes predictable.

## 6. References

Surveys and measurements
- Stack Overflow Developer Survey 2025, Technology section: https://survey.stackoverflow.co/2025/technology/
- PNet - ReactJS jobs in Malawi: https://www.pnet.co.za/results/reactjs/in-malawi
- IDIAS software engineer advert (Lilongwe): https://idias.mw/company/careers/software-engineer
- npm download trends (check yourself and record the date): https://npmtrends.com/

React
- Learn React: https://react.dev/learn
- Writing markup with JSX: https://react.dev/learn/writing-markup-with-jsx
- Render and commit (what React does when state changes): https://react.dev/learn/render-and-commit
- Preserving and resetting state (reconciliation and `key`): https://react.dev/learn/preserving-and-resetting-state
- Passing data deeply with context: https://react.dev/learn/passing-data-deeply-with-context
- You might not need an effect: https://react.dev/learn/you-might-not-need-an-effect
- Reusing logic with custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
- Hooks reference: https://react.dev/reference/react/hooks
- React Router: https://reactrouter.com
- Vite: https://vite.dev

Other frameworks
- Angular: https://angular.dev
- Vue - reactivity in depth: https://vuejs.org/guide/extras/reactivity-in-depth.html
- Svelte: https://svelte.dev/docs/svelte/overview
- Next.js: https://nextjs.org/docs

Backend, database and security
- Express: https://expressjs.com
- JSON Web Token standard (RFC 7519): https://datatracker.ietf.org/doc/html/rfc7519
- OWASP Password Storage Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP XSS Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- PostgreSQL documentation: https://www.postgresql.org/docs/current/
- Supabase - connecting to your database (direct vs pooler strings, IPv4/IPv6): https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase - Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase - Storage: https://supabase.com/docs/guides/storage
- MDN - Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

Deployment
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs
