// Stub for SvelteKit's `$app/stores` in the standalone vitest projects (no Kit
// runtime there). Components that read `$page` (e.g. Note.svelte) need a readable
// `page` with a `url`; the exact path is irrelevant to these unit/SSR tests.
import { readable } from 'svelte/store';

export const page = readable({ url: new URL('http://localhost/slides/stub.html') });
export const navigating = readable(null);
export const updated = readable(false);
