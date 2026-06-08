import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {

	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'docs',
			assets: 'docs',
			fallback: "article.html",
			precompress: true
		}),
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
