# Distribution — Phase 1: ship the framework as packages from GitHub Releases

> Projects that use GeekPresent (EnvFolioPromotion, CodingBoothPromotion, the CodingBooth blog)
> today hold a **copy** of `src/lib` and drift from it. Phase 1 turns the framework into
> versioned packages, published by hand from a GitHub Action as **tarballs attached to a GitHub
> Release** — no npmjs.com — and makes the showcase site's Pages deploy a matching manual button.

## Objective

- A project installs GeekPresent by **one line in `package.json`** and upgrades by changing a
  version number, instead of copying folders and merging by hand.
- A project can still **change framework code locally**, and that change is a visible file in the
  project (a patch), not an invisible edit buried in a copied folder.
- Releasing is **one button**: pick patch / minor / major, the Action does the rest.
- Nothing goes through the npm registry website. GitHub is the only host.

## Why this shape (settled by the spike — do not revisit)

A throwaway spike (pnpm 12.14 in the booth; a tiny `@geekpresent/spike` package with one
`.svelte` component and one `.ts` function) proved each point below.

**1. Ship raw source, no build step.**
The package contains `.svelte` and `.ts` as written. Vite compiles them in the consuming
project. Proven in the dom vitest project, the `svelte/server` ssr project, and a real
`vite build` prerender.

**2. A tarball URL, not a git reference.**
`github:owner/repo#tag&path:packages/x` installs only that folder and pins the commit in the
lock — but two things break it:

| | git reference | tarball URL |
| --- | --- | --- |
| `pnpm patch` (local edits) | **refused** (`ERR_PNPM_PACKAGE_MANAGER_PATCH_UNSUPPORTED_RESOLUTION`) | works |
| install inside a worktree booth | **fails** (`git ls-remote`: "not a git repository") | works — no git involved |
| booth image build (pre-runs `pnpm install`) | needs git + network | plain HTTPS |

So each release attaches one `.tgz` per package, and a project depends on its URL:

```json
"@geekpresent/core": "https://github.com/NawaMan/GeekPresent/releases/download/v1.4.0/geekpresent-core-1.4.0.tgz"
```

**3. Local changes are `pnpm patch`.**
`pnpm patch @geekpresent/core` → edit → `pnpm patch-commit`. The diff lands in `patches/`, and
`patchedDependencies` in `pnpm-workspace.yaml` names it. Proven on upgrade:

- upstream changed a **different** file → new code arrives, patch reapplies;
- upstream changed the **same** lines → install **fails loudly** (`error applying hunk #1`), so a
  patch never silently goes stale.

For a larger change, copy the component into the project and own it; a patch is for small edits.

**4. One version for every package (lockstep).**
`@geekpresent/charts@1.4.0` always goes with `@geekpresent/core@1.4.0`. No compatibility matrix,
one tag per release (`vX.Y.Z`).

**5. Tests, specs and example decks stay upstream.**
The tarball holds framework code only. The showcase site (every example deck) is published to
GitHub Pages from this repo, not shipped to projects.

## What ships, what stays

| Ships in `@geekpresent/core` | Stays in this repo only |
| --- | --- |
| `src/lib/**` (components, templates, stores, utils, draw, themes, styles…) | `src/routes/**` decks, landing, `text.html` |
| Vite plugins (`adjust/devSavePlugin.ts` and friends), exported | `tests/`, `specs/`, `TODO.md` |
| Framework route bodies for `_handout`, `_recorder`, `_source-edit`, `robots.txt`, `sitemap.xml` (as components/handlers the project's stub routes import) | `scripts/`, `justfile`, `.booth/`, `utils/` |
| | `docs/` (the built site) |

`@geekpresent/charts` (`chart/`, `datatable/`) splits out in **Phase 2**, once a dependency check
confirms core never imports them. `draw/` is used by core (`Connector`, `Block`, `Spotlight`) and
stays in core.

## Prerequisites in upstream (built in Phase 1)

**A. One settings file instead of edits to framework files.**
Every observed drift (the projects' changed `Copyright`, `seo/config.ts`, `seo/routes.ts`) is a
setting, not a behaviour change. A project-level `geekpresent.config.ts` carries them:

```ts
export default {
	siteUrl: 'https://codingbooth.io',          // GEEKPRESENT_SITE_URL still overrides it
	siteName: 'CodingBooth',
	siteDescription: '…',
	ogImageAlt: '…',
	copyright: { name: 'CodingBooth', url: 'https://codingbooth.io/' },
	textRoutes: ['/', '/blog.html']              // was: editing TEXT_ROUTES
} satisfies GeekPresentConfig;
```

`vite.config.ts` imports it and hands it to `geekpresent(site)`. The plugin resolves it once
(`config/siteConfigCore.ts`) and injects it as the `__GEEKPRESENT_CONFIG__` define — the route
the site URL already took — and code reads it as `SITE` from `$lib/config/site`. Not a virtual
module: a define needs no import that TypeScript must be taught about, and a plain object in
`vite.config.ts` needs no loader for a `.ts` config file. Upstream's own site uses the same file.

One more setting fell out of the build: **`libImport`**, how a slide reaches the framework
(`$lib` here, `@geekpresent/core` in a project). ADJUST's SAVE and ANNOTATE's freeze write a
`<Draw>` import INTO the author's slide, and that import must name the right module. The plugin
picks it from where it was loaded (inside `node_modules` ⇒ the package), and the browser sends
it with the save request.

**B. The package, packed from `src/lib` without moving it.**
`packages/core/package.json` names the package; `utils/pack-core.mjs` stages `src/lib` into
`.pack/core/` and packs it. Corrections to the first draft of this spec:

- `src/lib` **does** use `$lib/` — 421 imports in 124 files. In a project `$lib` is the
  project's own folder, so the pack step rewrites every import specifier to a relative path. It
  touches import specifiers only (not comments, not generated code), and refuses to pack if one
  survives; `tests/packCore.test.ts` runs the same check over the live tree.
- An `exports` pattern (`"./*": "./src/*"`) maps paths literally. Vite then tries extensions,
  TypeScript does not, and neither looks for an index file — so `@geekpresent/core/presentation`
  type-checked as missing and `@geekpresent/core/draw` did not resolve at all. The pack step
  writes an exact export for every extensionless module and every index folder (~130 entries,
  generated, never hand-edited).
- Node cannot run TypeScript from `node_modules`, and `vite.config.ts` is loaded by Node. The
  plugin is compiled to `vite.js` (a Vite SSR build: our files bundled, packages external);
  `exports["./vite"]` points types at the source.
- Runtime dependency: `shiki` (SourceView / QuickCode). Peers: `svelte`, `@sveltejs/kit`, `vite`.

**C. Absolute globs resolve in the consuming project. ✓ Proven.**
`handoutDecks.ts`, `seo/routes.ts` and `searchIndex.ts` use `import.meta.glob('/src/routes/…')`.
From inside `node_modules` this still means the project's routes: a fresh project's build
prerendered its own deck into `/_handout/<deck>.html` and listed its own slides in
`sitemap.xml`. No fallback needed.

**D. Framework routes are stubs over `$lib/framework/`.**
`HandoutPage.svelte` + `handoutRoute.ts`, `RecorderPage` / `RecorderLayout`, `SourceEditPage` /
`SourceEditLayout`, `robots.ts`, `sitemap.ts`. Upstream's `src/routes` keeps a few-line stub for
each; the package ships the same stubs under `routes/` with `$lib/` turned into
`@geekpresent/core/`, generated from upstream's at pack time so the two cannot drift.

## The two workflows

### `release.yml` — publish core (+ libraries), run by hand

`workflow_dispatch` with one input, `bump`: `patch` / `minor` / `major`.

1. Check out `main`; set up pnpm + Node 22 (as `verify.yml`).
2. `svelte-kit sync`, `pnpm run check`, `pnpm test` — **stop on red**.
3. Raise the version in `packages/core/package.json` (`node utils/pack-core.mjs bump <kind>`);
   refuse if that tag already exists.
4. Pack (`node utils/pack-core.mjs`) — before anything is pushed, so a red run leaves nothing
   behind.
5. Commit `Release vX.Y.Z`, tag `vX.Y.Z`, push both (the one push that happens without a human
   typing `git push` — the human pressed the button).
6. `gh release create vX.Y.Z <tgz> --generate-notes`, with the install line on top.

Permissions: `contents: write`. If `main` is branch-protected, the Action needs a bypass (or a
deploy key) to push the version commit.

### `deploy-pages.yml` — publish the showcase site, run by hand

Unchanged build (the two-pass OG-card build stays), but the trigger becomes
**`workflow_dispatch` only** — the `push: main` trigger is removed, so the live site changes when
someone presses the button, same as a release. `verify.yml` still runs on every push.

## How a project uses it

```bash
# install
pnpm add https://github.com/NawaMan/GeekPresent/releases/download/v1.4.0/geekpresent-core-1.4.0.tgz

# change something locally
pnpm patch @geekpresent/core      # prints a temp folder; edit there
pnpm patch-commit <that folder>   # writes patches/@geekpresent__core.patch

# upgrade: edit the version in the URL (twice: tag and filename), then
pnpm install                      # fails loudly if a patch no longer applies
```

The project copies the stub routes once (`cp -r node_modules/@geekpresent/core/routes/.
src/routes/`) and adds `geekpresent(site)` before `sveltekit()` in its `vite.config.ts`
(`packages/core/README.md` has the whole setup). Making `adopt-geekpresent.sh` do this for a
package-mode project is part of migrating the projects (Phase 2). In Phase 1 it only moves its
Text-route edit from `seo/routes.ts` to `textRoutes` in `geekpresent.config.ts`.

## Phase 1 scope

| In | Out (later) |
| --- | --- |
| `geekpresent.config.ts` + define; remove the settings drift | `@geekpresent/charts` split (Phase 2) |
| `packages/core/package.json`, generated exports, pack step | Per-package versions |
| Verify absolute globs from `node_modules` | Changelog curation beyond `--generate-notes` |
| Exported plugins + route bodies; stub routes | npm registry (never) |
| `release.yml`; `deploy-pages.yml` manual-only | Migrating the three projects; adopt script in package mode |
| A test that fails on any `$lib/` import the rewrite misses | |

## Done when

Verified locally (a fresh project, booth, tarball served over HTTP from inside the booth):

- ✓ It installs the tarball by URL; its dom + ssr tests, `svelte-check` and `vite build` pass
  with a two-slide deck, a handout with both slides prerendered, and SEO/sitemap/robots built
  from ITS settings.
- ✓ In `vite dev`, the slide serves and the SAVE endpoints work; a frozen shape's import merges
  into the slide's `@geekpresent/core/draw` import.
- ✓ A `pnpm patch` survives an upgrade to a release that changed a different file.

Still to prove on GitHub (the first real release does it):

- `release.yml` run with `patch` produces a tag, a version commit and a Release with
  `geekpresent-core-X.Y.Z.tgz` attached.
- A project's booth **image build** fetches that URL (locally there was no HTTPS host to fetch
  from at image-build time).
- `deploy-pages.yml` no longer runs on push, and still deploys when started by hand.
