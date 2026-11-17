# Deploying SyncCraft

SyncCraft is a static site. The build writes plain files to `dist/`, and any static host can serve them. There is no server, database or environment variable.

Claude does not deploy. The owner runs these steps.

## Which host: Cloudflare Pages (recommended)

Both work, because the app is plain static files. Cloudflare Pages is the better fit here:

- **Commercial use:** Vercel's free Hobby plan is for non-commercial use only. Cloudflare Pages' free plan has no such rule.
- **Bandwidth:** Cloudflare Pages has no bandwidth cap on static files. Vercel Hobby caps it, and a shared learning tool that goes viral could hit that.
- **Headers:** `public/_headers` already sets caching and security headers for Cloudflare Pages. Vercel would need a separate `vercel.json`.
- **Pick Vercel instead if** you want the simplest GitHub import, preview URLs on every pull request with comments, and this stays a personal, non-commercial project.

## Settings for Cloudflare Pages (also right for Vercel and Netlify)

| Setting | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` (Cloudflare reads this name; Vercel uses the Node setting in project settings) |

Since Phase 8 the site has two addresses from the one `index.html`: the landing page at `/` and the game at `/play` (no router package; see `src/app/route.ts`). A direct visit to `/play` needs the host to answer with `index.html`:

- **Cloudflare Pages and Netlify:** `public/_redirects` does this (`/play /index.html 200`, a rewrite that keeps `/play` in the address bar). Vite copies it into `dist/`. Cloudflare Pages also falls back to `index.html` on its own when there is no `404.html`, so the rule is a belt-and-braces measure there.
- **Vercel:** ignores `_redirects`. Add a `vercel.json` with a rewrite from `/play` to `/index.html`; ask Claude to write it.

After deploying, open `https://<your-site>/play` directly and reload it once: the game should show, not a 404.

## Before the first deploy

Checked by Claude on 2026-11-13 (Phase 8): `npm test` (322 passed), `npm run build` (no errors, `dist/` is 2.1 MB, `dist/_redirects` present). You still do step 4.

1. `npm ci`
2. `npm test` passes.
3. `npm run build` finishes with no errors. One warning about the 3D scene chunk being over 500 kB is expected: it loads only when the learner turns the scene on.
4. `npm run preview`, then open the printed address and check: the landing page shows, "Start level 1" opens the game, `/play` loads directly and after a reload, the theme survives a reload, a level plays, the Field guide opens, Cheat sheet and Progress card download.
5. Licence: MIT, already added as `LICENSE`.

## Deploying to Cloudflare Pages

1. Push the repo to GitHub (you do the Git work).
2. In the Cloudflare dashboard: Workers & Pages, Create, Pages, Connect to Git, pick the repo.
3. Enter the settings from the table above and save. Every push to `main` then deploys on its own.
4. After the first deploy, open the `*.pages.dev` address and repeat the step 4 check above on the live site.

## CI and CD on GitHub

Two workflows in `.github/workflows/` check and publish the site automatically. Claude wrote them but does not run or trigger them. You turn them on.

| Workflow | Runs when | What it does |
| --- | --- | --- |
| `ci.yml` (CI, "continuous integration") | a push to any branch except `main`, and every pull request into `main` | `npm ci`, typecheck, `npm test`, `npm run build`. Red on GitHub if any step fails |
| `deploy.yml` (CD, "continuous delivery") | a push to `main`, or "Run workflow" in the Actions tab | runs `ci.yml` first, then, only if it is green, tells Cloudflare Pages to publish `main` |

Why a "deploy hook" and not a file upload: your Pages project is connected to GitHub, and Cloudflare cannot switch such a project to direct uploads. A deploy hook is a private URL; calling it makes Cloudflare build and publish the latest `main`, with the build settings you already entered.

One-time setup (you do this, once):

1. Cloudflare dashboard, Workers & Pages, your project, Settings, Builds, **Deploy hooks**: add a hook for the `main` branch and copy its URL.
2. GitHub, your repository, Settings, Secrets and variables, Actions, **New repository secret**: name `CLOUDFLARE_DEPLOY_HOOK`, value the URL. Treat the URL like a password: anyone who has it can trigger a build.
3. Back in Cloudflare, Settings, Builds, **Automatic deployments** (production branch): turn them off. Without this, Cloudflare builds on every push by itself and every change is published twice, with no CI gate.
4. Optional but recommended: GitHub, Settings, Branches, add a rule for `main` that requires the **CI / Typecheck, test, build** check, so a red pull request cannot be merged.

Until step 2 is done, the Deploy workflow runs CI, then prints "Deploy skipped" and stops without failing.

If the repository was renamed, nothing in these files needs changing: they use no repository name. The only name in them is the site address `https://synccrafts.pages.dev` in `deploy.yml`, shown as the environment link.

## If you choose Vercel

Import the repo at vercel.com/new. It detects Vite and fills in the same settings. To get the same caching, add a `vercel.json` with a `headers` rule for `/assets/(.*)`; ask Claude to write it.

## What loads when

| File | Size (gzip) | Loads |
| --- | --- | --- |
| Main bundle (landing page, app, levels, guides, engine) | about 150 kB | at first load |
| Code editor chunk | about 136 kB | when My view opens |
| 3D chunks (three.js and the station models, shared by every scene) | about 245 kB | after first paint, on a device that can draw 3D |
| Landing page scene | about 3 kB | after first paint, on the landing page |

## Browser support

Current Chrome, Edge, Firefox and Safari. The game (`/play`) is for a desktop at 1280 px wide or more. The landing page (`/`) also works on a phone. The 3D scenes need WebGL; without it the game shows the 2D views and the landing page shows still pictures.
