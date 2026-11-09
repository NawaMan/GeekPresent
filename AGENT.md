# AGENT.md — Copying the GeekPresent source into a project

**Making a site for someone with GeekPresent? Start at [`START.md`](START.md)**, not here. The
recommended route is `adopt-geekpresent.sh --package`: the site's source in a subfolder, with
GeekPresent as a dependency. This file is the manual for the other route, `--copy`.

If you are working **on GeekPresent itself** (this repo), this is the wrong file — read
**`AGENTS.md`**, especially *Quick start for agents*.

---

## Package, or copy?

| | **`--package`** (recommended) | **`--copy`** |
| --- | --- | --- |
| What lands in the project | the site's pages and settings; the framework is a dependency (`@geekpresent/core`) | the whole framework source, in a subfolder |
| Made from | [GeekPresentStarter](https://github.com/NawaMan/GeekPresentStarter) | this repository |
| What it scaffolds | a deck, a web page or a blog | the sample decks (all, one, or none plus an empty deck or page) |
| Upgrading | change the version in one URL | none — the copy is the project's now |
| Changing the framework | `pnpm patch @geekpresent/core` | edit the copied source directly |
| Agent manual afterwards | the site's `AGENTS.md` → `node_modules/@geekpresent/core/guide/README.md` | the copied `AGENTS.md` |

Copy only when the user wants to own and change the framework itself. The script picks copy for
`--copy`, and for the flags only copy has (`--mode`, `--keep`, `--kind none`), so an invocation
from before `--package` existed still does what it did.

The rest of this file is the **copy** route.

## What the copy is (orient in 30 seconds)

- A **SvelteKit static site** you **copy and own**. It lives in a subfolder of the project; you
  author there and build a static site (`adapter-static`, every route prerendered). **No server**:
  runtime `+server.js`, `+page.server.js`, a server `load()` and form `actions` do not run on
  GitHub Pages.
- **One slide = one route folder.** A deck lives at `<dir>/src/routes/<deck>/`; each slide is
  `<deck>/<name>.html/+page.svelte` plus a `+layout.js` that prerenders. Order is the deck's
  `pages.ts`. Multiple decks can coexist, each in its own folder.
- The host project keeps its own code untouched; GeekPresent is just files in one subfolder.

## Step 1 — run the bootstrapper

From the **root of the target project**:

```bash
# from a clone of this repo:
./adopt-geekpresent.sh --copy

# or straight from GitHub (run in the target project root):
curl -fsSL https://raw.githubusercontent.com/NawaMan/GeekPresent/main/adopt-geekpresent.sh | bash -s -- --copy
```

It is interactive by default (answer `?` at any prompt for an explanation); flags skip prompts;
`--yes` (or a non-TTY/piped run) takes all defaults. **Destructive steps confirm** unless `--yes`
is set. Nothing is committed, and nothing is built.

| Flag | Meaning | Default |
| --- | --- | --- |
| `--dir <name>` | subfolder to create | `geekpresent` |
| `--mode skeleton\|minimal\|full` | what happens to the sample decks (see below) | `minimal` |
| `--keep <deck>` | the sample deck to keep, in minimal mode | `slides` |
| `--kind deck\|text\|none` | what skeleton mode scaffolds | `deck` |
| `--name <name>` | the scaffolded deck or Text page | `slides` / `guide.html` |
| `--booth` / `--no-booth` | keep the CodingBooth, or remove it and build with host node + pnpm | `--booth` |
| `--dist <path>` | where the built site lands, relative to where you run the script | `<dir>/dist` |
| `--base </path>` | GitHub Pages base path (⚠️ see Constraints) | none |
| `--ci` / `--no-ci` | scaffold the deploy workflow | prompted |
| `--yes`, `-y` | accept defaults, skip confirmations | off |

**Modes:**
- `skeleton` — keep **no** sample deck: move them all into a gitignored `.samples-ref/` and
  scaffold an empty starting point (`--kind`): a deck with one title slide, a long-form Text page,
  or nothing.
- `minimal` — keep one sample deck as the starting template; move the other decks, `text.html`
  and `seo.html` into `.samples-ref/`, rewrite the landing page, and trim the sitemap's route
  list. The script then scans for any kept page that still links to a removed route and prints the
  exact `file:line` to fix.
- `full` — keep every sample deck verbatim. Builds out of the box; trim later by hand.

`skeleton` and `minimal` also move GeekPresent's own `README.md`, `AGENT.md`, `TODO.md` and the
`/todo` / `/pick-todo` skills into `.samples-ref/`, and write a short `README.md` for the adopted
folder. `AGENTS.md` stays: it is the authoring manual.

## Step 2 — what you get

```
<target-project>/
├─ .github/workflows/deploy-<dir>.yml   # added if --ci (builds the subfolder, deploys to Pages)
└─ <dir>/                               # GeekPresent, now plain files in your repo
   ├─ src/routes/<deck>/                # author here
   ├─ .samples-ref/                     # (skeleton/minimal) reference copies — gitignored, not built
   ├─ scripts/  booth  .booth/          # build scripts; the CodingBooth unless --no-booth
   └─ README.md  AGENTS.md              # the folder's README; the authoring manual
```

## Step 3 — author, build, deploy

- **Author** inside `<dir>/src/routes/<deck>/`. Add a slide: create `<name>.html/+page.svelte`
  (+ `+layout.js` with `export const prerender = true; export const trailingSlash = "never";`)
  and add a `{ path, title }` entry to the deck's `pages.ts`. Follow `<dir>/AGENTS.md`.
- **Reference, don't ship, the samples.** The originals are in `<dir>/.samples-ref/` — read them
  to learn the components; they are gitignored and not built.
- **Place elements visually with ADJUST mode.** Wrap things in `Block` / `ImageBlock` and toggle
  **ADJUST** (on in `pnpm dev`) to drag and resize, then **SAVE**, which in `pnpm dev` writes the
  moved tags straight into the slide's `.svelte` file — or **Copy** a tag and paste it by hand. On
  a built site SAVE refuses on click (**NOT ALLOWED**). ADJUST is off on the deployed site; a
  sticky `?adjust` flag re-enables it, and `adjust: true` on a slide's `pages.ts` entry offers it
  on that slide. The dev server writes source in other ways too (EDIT, EDIT NOTE, OVERVIEW deck
  editing), so re-read a file after the user has been working in the browser. Full playbook in
  `<dir>/AGENTS.md`.
- **Build.** The script's last lines print the exact command for the answers given, e.g.
  `cd <dir> && scripts/build-static.sh ./dist --zip` (through the booth), or
  `cd <dir> && pnpm install && NO_BOOTH=1 scripts/build-static.sh ./dist` (host toolchain).
- **Deploy:** push; then one-time enable **Settings → Pages → Source: GitHub Actions**. The
  workflow rebuilds on changes under `<dir>/`.

## Constraints & gotchas (read before promising anything)

- **A base path is a deploy-time variable, `GEEKPRESENT_BASE_PATH`.** A GitHub *project* page is
  served at `/<repo>/`; the copied `svelte.config.js` reads `GEEKPRESENT_BASE_PATH` into
  `kit.paths.base`, so `--base /<repo>` patches no source — with `--ci` it sets that variable in the
  scaffolded workflow, and local builds and the dev server stay at the root. Without `--ci`, set it
  in your own deploy build. Either way, end `siteUrl` in `geekpresent.config.ts` with the same path.
  A deploy built without it loads its scripts from the domain root and shows blank pages.
  (Scripts from before November 2026 wrote `BASE_PATH`, which nothing reads; rename it in a
  workflow they scaffolded.)
- **Static only.** No runtime server routes (see above). A prerendered GET endpoint (like
  `sitemap.xml`) is fine; a runtime `+server.js` is not.
- **Minimal-mode danglers** can't be auto-fixed — if the scan reports links to removed samples,
  either edit those lines or re-run with `--mode full` (or start over with `--mode skeleton`).
- **Builds need deps.** On a hardened pnpm setup, prefix build commands with
  `npm_config_verify_deps_before_run=false`.
- **Nothing is committed** by the script — review the diff, then `git add` deliberately.
