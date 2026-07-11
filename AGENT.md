# AGENT.md — Adopting GeekPresent into a project

Guidance for an AI agent (Claude Code or similar) asked to **add GeekPresent to an existing
project** so the user can build docs / slides / a promo site that deploy to GitHub Pages.

This is the *adoption* manual. Once GeekPresent lives inside the project, the day-to-day
**authoring** manual is the `AGENTS.md` that ships *inside* the adopted folder (e.g.
`docs-site/AGENTS.md`) — read that for slide/deck playbooks. Don't confuse the two.

---

## What GeekPresent is (orient in 30 seconds)

- A **SvelteKit static site** you **copy and own** — not an npm package. You drop it into the
  project as a subfolder, author there, and build a static site (`adapter-static`, every route
  prerendered). **No server**: `+server.js` (runtime), `+page.server.js`, `load()`, form `actions`
  do not run on GitHub Pages.
- **One slide = one route folder.** A deck lives at `<sub>/src/routes/<deck>/`; each slide is
  `<deck>/<name>.html/+page.svelte` (+ a `+layout.js` that prerenders). Order is the deck's
  `pages.ts`. Multiple decks can coexist, each in its own folder.
- The host project keeps its own code untouched; GeekPresent is just files in one subfolder.

## Step 1 — run the bootstrapper

From the **root of the target project**:

```bash
# from a clone of this repo:
./adopt-geekpresent.sh

# or straight from GitHub (run in the target project root):
curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash
```

It is interactive by default; flags skip prompts; `--yes` (or a non-TTY/piped run) takes all
defaults. **Destructive steps confirm** unless `--yes` is set. Nothing is committed.

| Flag | Meaning | Default |
| --- | --- | --- |
| `--dir <name>` | subfolder to create | `geekpresent` |
| `--mode minimal\|full` | sample handling (see below) | `minimal` |
| `--keep <deck>` | deck to keep in minimal mode | `slides` |
| `--base </path>` | GitHub Pages base path (⚠️ see Constraints) | none |
| `--ci` / `--no-ci` | scaffold the deploy workflow | prompted |
| `--build` / `--no-build` | run a verification build at the end | prompted |
| `--yes`, `-y` | accept defaults, skip confirmations | off |

**Modes:**
- `full` — keep every sample deck verbatim. Builds out of the box; trim later by hand.
- `minimal` — keep one deck as the starting template; move the other decks plus `text.html`
  and `seo.html` into a gitignored `.samples-ref/` (kept locally as reference for you, the
  agent), rewrite the landing page, and trim the sitemap's route list. The script then scans for
  any kept page that still links to a removed route and prints the exact `file:line` to fix.

## Step 2 — what you get

```
<target-project>/
├─ .github/workflows/deploy-<dir>.yml   # added if --ci (builds the subfolder, deploys to Pages)
└─ <dir>/                               # GeekPresent, now plain files in your repo
   ├─ src/routes/<kept-deck>/           # author here
   ├─ .samples-ref/                     # (minimal) reference copies — gitignored, build-excluded
   ├─ build-static.sh  booth  .booth/   # build into any folder; CodingBooth for host-free builds
   └─ README.md  AGENTS.md              # authoring docs for the engine itself
```

## Step 3 — author, build, deploy

- **Author** inside `<dir>/src/routes/<deck>/`. Add a slide: create `<name>.html/+page.svelte`
  (+ `+layout.js` with `export const prerender = true; export const trailingSlash = "never";`)
  and add a `{ path, title }` entry to the deck's `pages.ts`. Follow `<dir>/AGENTS.md`.
- **Reference, don't ship, the samples.** In minimal mode the originals are in `<dir>/.samples-ref/`
  — read them to learn the components, but they are gitignored and not built.
- **Place elements visually with LAYOUT mode.** To position things at exact canvas pixels, wrap
  them in `Block` / `ImageBlock` and toggle **LAYOUT mode** (an authoring aid, on in `pnpm dev`)
  to drag/resize, then **Copy** the tag back into source — or hit **SAVE**, which in `pnpm dev`
  writes the moved `Block`s straight into the slide's `.svelte` file. SAVE goes through the vite
  dev server, so on a static site it has no source tree to write to: there it refuses on click
  (**NOT ALLOWED**, with a tooltip) and Copy is the way back. LAYOUT is OFF on the deployed site;
  a sticky `?layout` flag re-enables it, and a slide that *teaches* layout can offer it in the
  build with `layout: true` in its `pages.ts` entry (available, not active — the mode still
  starts off). Full playbook in `<dir>/AGENTS.md`.
- **Build locally** (no host toolchain needed if CodingBooth is present):
  ```bash
  cd <dir> && ./booth -- ./build-static.sh ./dist --zip   # or: pnpm install && ./build-static.sh ./dist
  ```
- **Deploy:** push; then one-time enable **Settings → Pages → Source: GitHub Actions**. The
  workflow rebuilds on changes under `<dir>/`.

## Constraints & gotchas (read before promising anything)

- **Deploy at a domain root**, not a project sub-path. Setting `--base` patches
  `kit.paths.base`, but stock GeekPresent's SEO wiring emits a root-absolute `/sitemap.xml`, so
  prerender **fails** under a base path until that and any `/…`-absolute links are made
  base-aware. Prefer a user/org Pages site or a custom domain.
- **Static only.** No runtime server routes (see above). A prerendered GET endpoint (like
  `sitemap.xml`) is fine; a runtime `+server.js` is not.
- **Minimal-mode danglers** can't be auto-fixed — if the scan reports links to removed samples,
  either edit those lines or re-run with `--mode full`.
- **Builds need deps.** On a hardened pnpm setup, prefix build commands with
  `npm_config_verify_deps_before_run=false`.
- **Nothing is committed** by the script — review the diff, then `git add` deliberately.
