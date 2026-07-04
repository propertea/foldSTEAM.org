# Origami Site

A static site template where **you own the design and non-technical editors own the content**. Pages fold shut and unfold on navigation; sections unfold as they scroll into view. Content is edited through TinaCMS's WYSIWYG admin and stored as JSON in this repo — the deployed site is fully static with zero runtime CMS calls.

**Stack:** Vite + React · TinaCMS · GitHub Pages · GitHub Actions. Total hosting cost: $0.

## Architecture

```
content/            <- JSON written by Tina; the only thing editors touch
tina/config.js      <- schema: what editors CAN edit (fields, blocks)
src/                <- the design; editors can't reach this
  components/FoldRouter.jsx   pleated page-transition system
  components/Unfold.jsx       scroll-in paper reveal
  components/RichText.jsx     renders Tina's rich-text AST
  blocks/                     hero / prose / cards / split section components
.github/workflows/deploy.yml  builds admin + site, deploys to Pages
```

Content is glob-imported at build time (`src/lib/content.js`), so every editor save → Git commit → rebuild → live site. No API keys ship in the bundle.

Editing is **visual (WYSIWYG)**: opening a page in the admin shows the real site in a live preview — click any text on the page to focus its field and watch edits render in the actual design as you type (`useTina` in `src/App.jsx`, `tinaField` tags in `src/blocks/index.jsx`). For public visitors the site is still fully static: the only tinacms code in the bundle is the ~5 KB hook, and it makes no network calls outside the admin.

## Local development

```bash
npm install
npm run dev
```

- Site: http://localhost:5173
- Editor: http://localhost:5173/admin/index.html

Local mode needs **no account** — edits write straight to `content/*.json` and hot-reload the site. This is also how you (the developer) will usually work.

## Deploys (production: Cloudflare Pages, debounced)

Production builds run on Cloudflare Pages from `main`, **debounced**: every push (including each editor save) triggers `.github/workflows/debounced-deploy.yml`, which waits until pushes have been quiet for 5 minutes, then fires one Cloudflare build via a deploy hook — a burst of saves becomes a single deploy. One-time setup:

1. Cloudflare Pages project → **Settings → Builds & deployments** → disable automatic deployments for the production branch.
2. Same page → **Deploy hooks** → create one for `main` and copy its URL.
3. GitHub repo → **Settings → Secrets and variables → Actions** → add secret `CLOUDFLARE_DEPLOY_HOOK_URL` with that URL.

Run the workflow manually from the Actions tab to deploy immediately without the wait.

## Deploy to GitHub Pages (fallback)

1. Create a GitHub repo and push this project to `main`.
2. Repo **Settings → Pages → Source → GitHub Actions**.
3. Push (or run the workflow manually). The site deploys even before Tina Cloud is connected — the workflow just skips the admin build and prints a warning.

The workflow auto-detects the base path (`/<repo>/` vs `/` for `<user>.github.io` repos).

## Connect TinaCMS Cloud (gives editors login + WYSIWYG in production)

1. Sign up at https://app.tina.io (free tier) and create a project pointing at your GitHub repo, branch `main`.
2. From the Tina project's **Overview/Tokens** page copy the **Client ID** and a **read-only token**.
3. In your GitHub repo: **Settings → Secrets and variables → Actions**, add:
   - `TINA_CLIENT_ID`
   - `TINA_TOKEN`
4. In the Tina project settings, add your site URL (e.g. `https://<user>.github.io/<repo>/`) to the allowed origins.
5. Re-run the deploy workflow. The editor now lives at `https://<user>.github.io/<repo>/admin/index.html`.
6. Invite editors from the Tina dashboard (free tier includes 2 seats). They log in, edit, hit save — Tina commits to `main`, Actions redeploys in ~1–2 minutes.

Tell editors: **"your site slash admin"** is the only URL they need.

## Customizing (developer territory)

- **Design tokens** — top of `src/styles.css` (`--paper`, `--ink`, `--crane`, fonts).
- **Fold feel** — each navigation picks a random fold (`"accordion"`, `"bird"`, or `"waterbomb"`, never the same twice in a row); set `FOLD_STYLE` in `FoldRouter.jsx` to pin one. `SEGMENTS`, `ACCORDION_MS` and the flap plans tune them. Easing curves live under `.fold-layer` in the CSS.
- **New section types** — add a template in `tina/config.js`, a component in `src/blocks/index.jsx`, register it in `registry`. That's the whole loop.
- **New pages** — editors create them in the admin; they appear in the nav automatically via `navLabel`/`navOrder`.
- **Folders & blog** — pages can live in folders (**Add Folder** under Pages); a folder page's URL is `/#/<folder>/<name>`. The "Page list (blog)" section lists a folder's pages newest-first (by each page's `date`) with an excerpt — see `/blog`. Keep folder names lowercase.

## Notes & trade-offs

- Uses `HashRouter` (`/#/about`) so deep links can never 404 on GitHub Pages. If you want clean paths, switch to `BrowserRouter` with a `basename` and add the `404.html` redirect shim — the fold system doesn't care either way.
- `prefers-reduced-motion` disables all fold/unfold animation.
- Images editors upload land in `public/uploads/` (committed to the repo). Fine at this scale; swap in Cloudinary via Tina's media config if it ever isn't.
