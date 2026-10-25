import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import { configDefine } from './src/lib/vite';
import site from './geekpresent.config';

// Test config for the datatable module (tests/). Kept separate from
// vite.config.ts so the SvelteKit build pipeline is untouched; the svelte()
// plugin still picks up svelte.config.js (vitePreprocess for lang="ts").
export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	// The one build-time global the geekpresent() plugin injects: the site's settings
	// (see $lib/config/site.ts). Anything that pulls in <Seo> — which means anything that
	// renders <SlideDeck> — hits a bare ReferenceError without it. The site URL is pinned
	// to example.test so no test depends on where the real site deploys.
	define: configDefine(site, 'https://example.test'),
	resolve: {
		alias: {
			// SvelteKit aliases for the standalone test build: $lib as usual;
			// $app/environment stubbed (no Kit runtime under vitest).
			$lib: new URL('./src/lib', import.meta.url).pathname,
			'$app/environment': new URL('./tests/stubs/app-environment.ts', import.meta.url).pathname,
			'$app/stores': new URL('./tests/stubs/app-stores.ts', import.meta.url).pathname,
			'$app/navigation': new URL('./tests/stubs/app-navigation.ts', import.meta.url).pathname,
			'$app/paths': new URL('./tests/stubs/app-paths.ts', import.meta.url).pathname
		}
	},
	test: {
		name: 'dom',
		environment: 'jsdom',
		include: ['tests/**/*.test.ts'],
		// *.ssr.test.ts belongs to the ssr project (vitest.ssr.config.ts)
		exclude: ['tests/**/*.ssr.test.ts', '**/node_modules/**']
	}
});
