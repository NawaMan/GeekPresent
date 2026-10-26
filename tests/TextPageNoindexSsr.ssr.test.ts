// @vitest-environment node
//
// A draft Text: prerendered and reachable, but `noindex` keeps it out of search results.
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import TextPage from '$lib/components/TextPage.svelte';

it('emits robots noindex only when asked', () => {
	expect(render(TextPage, { props: { title: 'Draft', noindex: true } }).head).toContain(
		'<meta name="robots" content="noindex"'
	);
	expect(render(TextPage, { props: { title: 'Post' } }).head).not.toContain('noindex');
});
