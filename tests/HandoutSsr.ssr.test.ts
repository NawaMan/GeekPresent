// @vitest-environment node
//
// True server-side render of the handout (svelte/server, no DOM).
//
// This file exists for a POSITIVE that is true nowhere else in the project, and it is the
// whole feature. Every other page's slides are absent from the prerendered HTML — SlideDeck
// gates its slot on `initialized`, so a built slide is an empty shell until the browser
// arrives (that is what tests/*Ssr.ssr.test.ts pins elsewhere, and why prerender must be
// proven through svelte/server rather than by grepping docs/). A HANDOUT is a document: it
// must contain the slides. If this test ever goes green-to-blank, the printable deck has
// quietly become a blank stack of paper, and nothing else would catch it.
//
// It renders the REAL route component against the REAL decks (the globs in handoutDecks.ts
// read src/routes), so it is also the only test that would notice a deck whose slides stopped
// server-rendering at all.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Handout from '../src/routes/handout/[deck].html/+page.svelte';
import { pageRule, sheetMetrics } from '../src/lib/handout/handoutCore';
import { pages as portraitPages, deck as portraitDeck } from '../src/routes/portrait/pages';
import { pages as slidePages } from '../src/routes/slides/pages';

const out = (deck: string) => render(Handout, { props: { data: { deck } } });

// The portrait deck is three slides, so it is the cheap one to render — and it is also the
// only deck that is not 1920x1080, which makes it the one that proves the page maths.
describe('Handout (SSR) — portrait', () => {
	it('prerenders one sheet per slide', () => {
		const body = out('portrait').body;
		expect(portraitPages.length).toBe(3);
		expect(body.match(/class="sheet/g) ?? []).toHaveLength(portraitPages.length);
	});

	it('prerenders the SLIDES THEMSELVES — the point of the whole feature', () => {
		// Not a link to a slide, not an iframe of a slide, not a placeholder that will be
		// filled in on the client: the slide's own markup, in the file, before any JS runs.
		const body = out('portrait').body;
		expect(body).toContain('GeekPresent'); // title.html's <TitlePage>
		expect(body).toContain('Thank You'); // thank-you.html
		expect(body).toContain('class="canvas'); // each slide's 1080x1920 box
	});

	it('takes the page size from the deck, not from a constant', () => {
		// portrait/pages.ts declares 1080x1920, and the layout reads the SAME export, so the
		// handout cannot print this deck at the wrong size without the deck also displaying
		// at the wrong size.
		expect(portraitDeck).toMatchObject({ width: 1080, height: 1920 });
		expect(pageRule(sheetMetrics(portraitDeck))).toBe(
			'@page { size: 7.937in 13.333in; margin: 0.5in; }'
		);
		expect(pageRule(sheetMetrics({ width: 1920, height: 1080 }))).toBe(
			'@page { size: 13.333in 7.937in; margin: 0.5in; }'
		);
	});

	it('does NOT prerender the @page rule — it is written to the head in the browser', () => {
		// Deliberate, and the opposite of what it looks like. An {@html} in <svelte:head> is
		// rendered on the server and then ADOPTED unchanged at hydration, so a rule prerendered
		// here would outlive the reader turning notes on: the sheets would grow their notes band
		// and the paper would stay the size the server thought it should be, pushing every note
		// onto a page of its own. So the rule is owned by pageRuleDom instead, and printing —
		// which needs a browser anyway — gets the paper it actually asked for.
		expect(out('slides').head).not.toContain('@page');
	});

	it('emits no NaN into the printed page size', () => {
		// A malformed @page does not degrade — it takes the paper size down with it.
		const { head, body } = out('portrait');
		expect(head).not.toContain('NaN');
		expect(body).not.toContain('NaN');
	});

	it('prints each deck on ITS OWN surface, not on GeekPresent’s defaults', () => {
		// The deck's surface is a set of <SlideDeck> props, and the handout never mounts the
		// layout that passes them — so it reads them from pages.ts, which the layout now reads
		// too. If that link breaks, a light deck prints on a black page and a portrait deck
		// prints at the wrong text size, both silently. Hence: assert the surface reached the
		// canvas.
		expect(out('portrait').body).toContain('--base-font:1.8em');

		const geeklight = out('geeklight').body;
		expect(geeklight).toContain('gp-deck theme-light'); // the theme class SlideDeck would set
		expect(geeklight).toContain('--content-bg:'); // …the watercolor
		expect(geeklight).toContain('Merriweather'); // …and the serif

		// The main deck declares nothing, so it must inherit the defaults — and crucially must
		// NOT be handed an empty --content-bg, which is an opinion of nothing and paints the
		// slide transparent.
		const slides = out('slides').body;
		expect(slides).toContain('--base-font:1.5em');
		expect(slides).not.toContain('--content-bg');
	});
});

describe('Handout (SSR) — the main deck', () => {
	it('prerenders EVERY slide of a 60-plus-slide deck into one document', () => {
		const body = out('slides').body;
		expect(slidePages.length).toBeGreaterThan(50);
		expect(body.match(/class="sheet/g) ?? []).toHaveLength(slidePages.length);
	});

	it('prerenders NO navigation bar — not one per slide, not one at all', () => {
		// The negative that matters. A slide outside the deck shell still builds its own bar,
		// and sixty-odd of them would each arm a global keydown listener and emit their own
		// paging links for the prerenderer to crawl. NavigationBar renders nothing in a
		// handout (it reads getHandout()), so the document holds none.
		//
		// Asserted against the BAR, not against the word "NEXT": this deck documents its own
		// navigation, so several slides say NEXT and PREV in prose and show the bar's source in
		// a code block. Those are content, and content is exactly what a handout is for.
		const body = out('slides').body;
		expect(body).not.toContain('class="nav gp-chrome');
		expect(body.match(/class="nav[ "]/g) ?? []).toHaveLength(0);
	});

	it('prerenders speaker notes into the DOM but not into view', () => {
		// Notes are always in the markup and shown by a CLASS, so the prerendered file and the
		// hydrated one hold the same DOM — a handout that built its notes conditionally would
		// hydrate into different markup than it shipped. The server has no query string to
		// read, so the document starts without the `with-notes` class.
		const body = out('slides').body;
		expect(body).toContain('class="note no-print'); // in the document…
		expect(body).not.toContain('with-notes'); // …but not turned on
	});

	it('renders without a browser, a window or a deck shell around it', () => {
		// The handout mounts no SlideDeck: it publishes the deck's context itself and renders
		// the slides directly. Every one of them must therefore survive a server render — a
		// single slide reaching for `document` or `url.searchParams` would take the whole
		// printable deck down, and this is what says so.
		expect(() => out('slides')).not.toThrow();
	});

	it('refuses a name that is not a deck by rendering nothing rather than throwing', () => {
		// The route's load() answers 404 first; this is the second lock, so a bad name can
		// never produce a document of blank sheets.
		const { body } = out('not-a-deck');
		expect(body).not.toContain('class="sheet');
	});
});
