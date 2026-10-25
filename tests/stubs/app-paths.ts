// Stub for SvelteKit's `$app/paths` in the standalone vitest projects (no SvelteKit runtime
// there). Both are '' in this project's real config too — every build except the GitHub Pages
// deploy (GEEKPRESENT_BASE_PATH, see svelte.config.js) serves from the root — so a page that
// builds a URL from `base` gets the same string here that it gets in a local build.
export const base = '';
export const assets = '';
