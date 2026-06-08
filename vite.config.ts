import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	server: {
		host: '0.0.0.0'
	},
	optimizeDeps: {
        exclude: ["codemirror", "@codemirror/language-javascript"],
    },
});
