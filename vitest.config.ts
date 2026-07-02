import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

// Test config for the datatable module (tests/). Kept separate from
// vite.config.ts so the SvelteKit build pipeline is untouched; the svelte()
// plugin still picks up svelte.config.js (vitePreprocess for lang="ts").
export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts']
	}
});
