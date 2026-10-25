import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Where the prerendered static site is written. Defaults to `docs/` (used by the
// GitHub Pages flow); `scripts/build-static.sh` overrides it to build into any folder.
const outDir = process.env.GEEKPRESENT_OUT || 'docs';

// Emit .br/.gz alongside each asset. Only useful when the host serves precompressed
// files (nginx gzip_static, Caddy, …). Default on (keeps the docs/ output as-is);
// `scripts/build-static.sh` sets GEEKPRESENT_PRECOMPRESS=0 to skip the dead copies.
const precompress = process.env.GEEKPRESENT_PRECOMPRESS !== '0';

// The path the site is served under, for a host that puts it below the domain root — a
// GitHub project page lives at `/<Repo>/`. Default '' (the root), which is what every local
// build, `just serve-build` and the recorder expect; the Pages workflow sets
// GEEKPRESENT_BASE_PATH=/GeekPresent. SvelteKit wants a leading slash and no trailing one.
const basePath = (process.env.GEEKPRESENT_BASE_PATH || '').trim().replace(/^\/*/, '/').replace(/\/+$/, '');

export default {

	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: outDir,
			assets: outDir,
			// SPA fallback: the empty app shell a host serves for a URL that has no
			// prerendered file. Named 404.html because that is the one name GitHub
			// Pages acts on — it serves this file, with a 404 status, for any unknown
			// path, so a mistyped slide URL boots the app and lands on SvelteKit's
			// styled error page instead of GitHub's default one.
			//
			// It used to be "article.html", which was inert on every host AND read like
			// a content page: it answered 200 with a blank, title-less document at a
			// URL that looked like a real article. A host that serves nothing on 404
			// simply never reaches this file — every route is prerendered, so nothing
			// depends on the fallback either way.
			fallback: "404.html",
			precompress
		}),
		// Root-absolute asset URLs (`/_app/…`). Required so a handout's `<base href>` for a
		// nested deck (`/references/shell/`) does not re-root relative `../_app/…` links into
		// `/references/_app/…`. Root-absolute means a subpath deploy MUST set the base, or
		// every script and stylesheet is fetched from the domain root and 404s.
		paths: {
			base: basePath,
			relative: false
		},
		prerender: {
			// There is no site-wide favicon in static/ (presentations set their own
			// via <svelte:head>). Don't fail the build over that one 404; still fail
			// on any other broken link.
			handleHttpError: ({ path, message }) => {
				if (path === '/favicon.png') return;
				throw new Error(message);
			}
		}
	}
};
