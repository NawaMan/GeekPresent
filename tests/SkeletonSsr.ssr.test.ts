// @vitest-environment node
//
// The skeleton deck (utils/skeleton/deck) is what `adopt-geekpresent.sh --mode skeleton`
// copies into a brand-new project as src/routes/<deck>/. It is the FIRST thing an adopter
// ever sees, so a skeleton that ships broken is worse than no skeleton at all.
//
// It is a template, not a route: nothing in src/ imports it, so a rename inside
// $lib/templates would rot it silently and only surface in someone else's fresh project.
// Rendering it here through svelte/server is what keeps that honest — and it is the same
// prerender contract every slide is held to, since a deck is a prerendered static site.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import TitleSlide from '../utils/skeleton/deck/title.html/+page.svelte';
import TextPageBody from '../utils/skeleton/text/+page.svelte';
import { pages } from '../utils/skeleton/deck/pages';

describe('skeleton text (SSR)', () => {
	// The --kind text scaffold: a docs site rather than a talk. Same contract — it is the
	// first page that adopter sees, and nothing in src/ imports it, so only this renders it.
	it('the Text page prerenders', () => {
		const { body } = render(TextPageBody);
		expect(body).toContain('My Text');
	});
});

describe('skeleton deck (SSR)', () => {
	it('the title slide prerenders — the template it imports still resolves', () => {
		const { body } = render(TitleSlide);
		expect(body).toContain('My Deck');
		expect(body).toContain('A talk about something');
	});

	// pages.ts IS the deck: the nav arrows and the ToC read this array, and a slide
	// missing from it is unreachable. The scaffold ships exactly one slide, and its
	// `path` must be the route dir that sits next to it — a typo here is a 404 on the
	// adopter's very first page.
	it('publishes exactly the one slide it scaffolds, by its route-dir name', () => {
		expect(pages).toEqual([{ path: 'title.html', title: 'Title' }]);
	});
});
