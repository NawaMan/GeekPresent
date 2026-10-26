# @geekpresent/core

GeekPresent's framework — slides and long-form texts in HTML, CSS and Svelte — as a package.
It ships **source** (`.svelte`, `.ts`); your project's Vite compiles it. It is published as a
tarball on each [GitHub Release](https://github.com/NawaMan/GeekPresent/releases), not on npm.

**Starting a new site?** [GeekPresentStarter](https://github.com/NawaMan/GeekPresentStarter) is all
of the below already done — *Use this template*, enable Pages, deploy.

**Authoring with an AI agent?** Point it at `node_modules/@geekpresent/core/guide/README.md` —
how a site fits together, every component indexed, one file per group, for this exact version.

## Install

```json
"dependencies": {
	"@geekpresent/core": "https://github.com/NawaMan/GeekPresent/releases/download/v0.1.3/geekpresent-core-0.1.3.tgz"
}
```

Upgrade by changing the version in that URL (it appears twice) and running `pnpm install`.
Peer dependencies: `svelte` 5, `@sveltejs/kit` 2, `vite` 5.

## Set up

**1. Settings** — `geekpresent.config.ts` at the project root. Every field is optional:

```ts
import type { GeekPresentConfig } from '@geekpresent/core/vite';

export default {
	siteUrl: 'https://example.com',     // absolute SEO tags + sitemap; '' omits them
	siteName: 'My Talks',
	siteDescription: 'What this site is, in under 160 characters.',
	ogImageAlt: 'My Talks',
	copyright: { name: 'Me', url: 'https://example.com/' },
	textRoutes: ['/']                    // standalone Text pages, for the sitemap
} satisfies GeekPresentConfig;
```

`GEEKPRESENT_SITE_URL`, when set, overrides `siteUrl` for one build.

**Served below the domain root** (a GitHub project page, `https://<you>.github.io/<Repo>/`)? Set
`kit.paths.base` in `svelte.config.js` for that build — e.g.
`base: process.env.GEEKPRESENT_BASE_PATH || ''` and `GEEKPRESENT_BASE_PATH=/<Repo>` in the deploy
workflow — and end `siteUrl` in the same path. Without it every page fetches its scripts from the
domain root and loads blank.

**2. Vite** — the plugin goes **before** `sveltekit()`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { geekpresent } from '@geekpresent/core/vite';
import site from './geekpresent.config';

export default defineConfig({ plugins: [geekpresent(site), sveltekit()] });
```

For vitest, `geekpresentConfig(site)` from the same module gives the settings without the
dev-server endpoints.

**3. Framework routes** — copy the stubs into your routes once:

```bash
cp -r node_modules/@geekpresent/core/routes/. src/routes/
```

They give you the printable handout (`/_handout/<deck>.html`), the recorder and source-editor
windows, `robots.txt` and `sitemap.xml`. Each is a few lines that import from the package.

## Use

```svelte
<script lang="ts">
	import SlideDeck from '@geekpresent/core/components/SlideDeck.svelte';
	import { setPages } from '@geekpresent/core/presentation';
	import { Draw, Rect } from '@geekpresent/core/draw';
</script>
```

Anything under the framework's `src/lib` is importable the same way: `$lib/x` in GeekPresent is
`@geekpresent/core/x` in your project.

## Change something

Small edit to framework code:

```bash
pnpm patch @geekpresent/core          # prints a folder; edit the file there
pnpm patch-commit <that folder>       # writes patches/@geekpresent__core.patch
```

The patch reapplies on every upgrade. If an upgrade changed the same lines, `pnpm install` fails
and says so — the patch never goes stale silently. For a bigger change, copy the component into
your project and own it.
