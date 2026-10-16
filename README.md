# CodeKwes

A self-hosted practice hub for freeCodeCamp learners.

Browse the full freeCodeCamp curriculum (632 practice blocks across the 7 current
certifications), keep track of everything you have finished, and write your own
HTML / CSS / JavaScript in a built-in sandboxed playground with a live preview and
console.

All challenge content stays on freeCodeCamp.org. This project is an independent
companion site: every block in the catalog deep-links to the matching lesson at
`https://www.freecodecamp.org/learn/<cert>/<block>`, and your progress is stored
here - either in your browser (local mode) or in your own Supabase database once
configured.

## Features

- **Full curriculum catalog** - 632 blocks from 7 certifications, generated
  directly from freeCodeCamp's open-source curriculum structure files.
- **Filters and search** - filter by certification, block type (workshop, lab,
  lecture, review, quiz, exam, review project) and keyword; hide completed items.
- **Progress tracking** - one-click "done" toggle per block, per-certification
  progress bars, and a dashboard with your completed list.
- **Code playground** - CodeMirror editor with HTML / CSS / JS panes, sandboxed
  live preview, console output bridge, keyboard shortcut to run
  (Ctrl/Cmd + Enter), and optional auto-run.
- **Saved snippets** - save playground code snippets and load them back later.
- **Accounts (optional)** - email + password sign-up/sign-in via Supabase.
  Progress and snippets sync to the cloud; without Supabase everything still
  works using localStorage.
- **Independent hosting** - deploy free on Cloudflare Pages, database on
  Supabase.

## Tech stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | React 18 + TypeScript, built with Vite 6      |
| Styling   | Tailwind CSS v4 (`@tailwindcss/vite`)         |
| Routing   | React Router v6                               |
| Editor    | CodeMirror 6 via `@uiw/react-codemirror`      |
| Backend   | Supabase (Postgres + Auth, RLS-protected)     |
| Hosting   | Cloudflare Pages (builds from GitHub)         |

## Requirements

- **Node.js 18+** (20 or 22 LTS recommended) - <https://nodejs.org>
- **npm** (comes with Node.js)
- **Git** - <https://git-scm.com> (only needed to push to GitHub)
- A free **Supabase** account - <https://supabase.com> (optional at first)
- A free **Cloudflare** account - <https://dash.cloudflare.com> (for deployment)

Verify your tools:

```bash
node -v
npm -v
git --version
```

## Quick start

```bash
git clone https://github.com/<your-username>/codekwes.git
cd codekwes
npm install
npm run dev
```

Open the printed URL (usually <http://localhost:5173>). The site is fully usable
right away in **local mode** - no database required.

Scripts:

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload                |
| `npm run build`   | Type-check and build production assets into `dist/` |
| `npm run preview` | Serve the production build locally                  |
| `npm run deploy`  | Build and upload `dist/` to Cloudflare Pages        |

## Supabase setup (accounts + cloud sync)

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor -> New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
   This creates the `profiles`, `progress`, and `snippets` tables with
   Row Level Security policies and a trigger that auto-creates a profile on
   sign-up. It is safe to re-run.
3. Go to **Project Settings -> API** and copy:
   - **Project URL**
   - **anon public** API key (this key is meant to be public - RLS protects the
     data; never use the `service_role` key in frontend code)
4. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. Restart `npm run dev` (Vite reads env vars at startup).

Development tip: in **Authentication -> Providers -> Email**, turn off
**Confirm email** while testing so new accounts can sign in immediately.

When Supabase is not configured, the app runs in local mode: an amber banner
appears in the navbar, and progress + snippets are saved to localStorage. Any
local progress you collected before signing in is merged into your account on
first login.

## Deploy to Cloudflare Pages (recommended)

1. Push the project to GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/codekwes.git
   git push -u origin main
   ```

2. In the Cloudflare dashboard go to **Workers & Pages -> Create -> Pages ->
   Connect to Git**, pick your repository.
3. Build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: leave empty (repo root)
4. Add environment variables (Production and Preview):

   | Name                   | Value                        |
   | ---------------------- | ---------------------------- |
   | `VITE_SUPABASE_URL`    | your Supabase project URL    |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key     |
   | `NODE_VERSION`         | `20` (pin if builds complain) |

5. Click **Save and Deploy**. Every push to `main` redeploys automatically;
   pull requests get preview URLs.

Client-side routing already works in production: `public/_redirects` contains
`/* /index.html 200`, which Cloudflare Pages applies after each build so that
refreshing `/practice/javascript-v9/...` does not 404.

Optional: connect a custom domain under **Pages -> your project -> Custom
domains**.

### Alternative: direct upload with Wrangler

If you prefer deploying from your machine instead of Git integration:

```bash
npm run deploy
```

This runs the production build and calls `wrangler pages deploy dist`. The first
run opens a browser to log in to Cloudflare and asks for (or creates) a Pages
project name. Add your Supabase env vars as build-time variables in
`.env` - they are inlined during `npm run build`.

## Curriculum data

The catalog is generated at runtime from snapshot files in `src/data/fcc/`,
which are copied from the freeCodeCamp repository:

- Source: <https://github.com/freeCodeCamp/freeCodeCamp>
- Path: `curriculum/structure/superblocks/<cert-slug>.json`
- Raw URL pattern:
  `https://raw.githubusercontent.com/freeCodeCamp/freeCodeCamp/main/curriculum/structure/superblocks/<cert-slug>.json`

Certifications included (block counts at the time of the snapshot):

| Certification                              | Blocks |
| ------------------------------------------ | -----: |
| Responsive Web Design (`-v9`)              |    158 |
| JavaScript (`-v9`)                         |    237 |
| Front-End Development Libraries (`-v9`)    |     59 |
| Python (`-v9`)                             |     88 |
| Relational Databases (`-v9`)               |     34 |
| Back-End Development and APIs (`-v9`)      |     55 |
| Full-Stack Developer (`-v9`, exam, upcoming) |    1 |

To refresh the data later, download the newest JSON files into `src/data/fcc/`
(keeping the same file names) - [`src/lib/catalog.ts`](src/lib/catalog.ts)
rebuilds the catalog automatically. Block titles are derived from slugs by
`prettyTitle()`; if you find an awkward auto-generated title, add a fix to the
`WORD_FIXES` map in that file.

Progression model:

- Free-form practice (workshops, labs, lectures, reviews, quizzes) is tracked
  with a simple done / not done toggle on this site.
- Certification exams and cert projects belong to freeCodeCamp itself - the
  catalog links to them but marks them as fCC-graded.

## Project structure

```
.
├─ index.html                  # HTML entry (fonts, meta, #root)
├─ package.json
├─ vite.config.ts              # React + Tailwind v4 plugins
├─ tsconfig*.json
├─ .env.example                # Supabase env template
├─ public/
│  ├─ _redirects               # SPA fallback for Cloudflare Pages
│  └─ favicon.svg
├─ supabase/
│  └─ schema.sql               # Tables, RLS policies, signup trigger
└─ src/
   ├─ main.tsx                 # React entry (BrowserRouter)
   ├─ App.tsx                  # Providers + routes
   ├─ index.css                # Tailwind theme + component classes
   ├─ types.ts
   ├─ data/
   │  ├─ certifications.ts     # Cert metadata, legacy certs, extra practice
   │  ├─ templates.ts          # Playground starter templates
   │  └─ fcc/*.json            # Curriculum snapshots (7 certification files)
   ├─ lib/
   │  ├─ catalog.ts            # Builds the flat block catalog from the JSON
   │  ├─ supabase.ts           # Optional Supabase client
   │  ├─ storage.ts            # localStorage fallback helpers
   │  └─ color.ts
   ├─ contexts/
   │  ├─ AuthContext.tsx       # Session, sign in / sign up / sign out
   │  └─ ProgressContext.tsx   # Completed blocks + local->cloud sync
   ├─ hooks/
   │  └─ useSnippets.ts        # Snippet CRUD (cloud or local)
   ├─ components/
   │  ├─ Layout.tsx            # Navbar, banner, footer
   │  ├─ ChallengeCard.tsx
   │  ├─ TypeBadge.tsx
   │  ├─ icons.tsx
   │  └─ playground/           # CodePane, PreviewPane, ConsolePane
   └─ pages/
      ├─ HomePage.tsx
      ├─ CatalogPage.tsx
      ├─ BlockDetailPage.tsx
      ├─ PlaygroundPage.tsx
      ├─ LoginPage.tsx
      ├─ DashboardPage.tsx
      ├─ ResourcesPage.tsx
      └─ NotFoundPage.tsx
```

Routes:

| Path                                | Page                                   |
| ----------------------------------- | -------------------------------------- |
| `/`                                 | Home (hero, how it works, cert grid)   |
| `/practice`                         | Catalog with filters and search        |
| `/practice/:certSlug/:blockSlug`    | Block detail + link to freeCodeCamp    |
| `/playground`                       | Code editor, live preview, console     |
| `/resources`                        | All certifications, community, docs    |
| `/login`                            | Sign in / create account               |
| `/dashboard`                        | Progress overview and completed list   |

## Troubleshooting

- **`npm` / `node` is not recognized** - Node.js is not installed or the
  terminal was not restarted after installing it. Install Node LTS from
  <https://nodejs.org> and open a new terminal.
- **Deep links 404 on the deployed site** - make sure `dist/_redirects` exists
  after building. The file lives in `public/` so Vite copies it automatically;
  don't move it out of `public/`.
- **"Email not confirmed" when signing in** - either click the link in the
  Supabase confirmation email or disable **Confirm email** in
  Authentication -> Providers -> Email.
- **Progress stays local even though Supabase is set up** - env var names must
  start with `VITE_`, and you must restart the dev server (or rebuild) after
  changing `.env`.
- **Cloudflare build fails on Node version** - add an environment variable
  `NODE_VERSION=20` (Vite 6 requires Node 18+).
- **Blank page after deploy** - open the browser console; usually a missing
  environment variable at build time. Remember Vite inlines env vars at build
  time, so update the Cloudflare variables and trigger a redeploy.

## Attribution and license

This is an independent, unaffiliated companion project. It does not copy
challenge text, tests, or solutions - it links learners to freeCodeCamp.org,
where the actual lessons live.

- freeCodeCamp repository: <https://github.com/freeCodeCamp/freeCodeCamp>
  - Code: BSD-3-Clause
  - Curriculum content: CC BY-SA 4.0
- "freeCodeCamp" is a trademark of freeCodeCamp.org.

Site code is released under the [MIT License](LICENSE). See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency licenses.
