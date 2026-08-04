// @vitest-environment node
//
// True server-side render of Link (svelte/server, no DOM). Link is purely
// declarative — no onMount, no browser API — so the tone class, the target/rel and
// the kind glyph must all come from props alone, which is exactly what prerendering a
// slide (and rendering a handout, the one page that DOES put slide markup in the built
// HTML) does. The glyph matters most here: with one shared colour and stroke it is the
// ONLY cue that a link leaves the site, so a printed handout that lost it would say
// nothing at all about where its links go.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Link from '../src/lib/components/Link.svelte';

describe('Link (SSR)', () => {
	it('renders an internal link plain: staying tone, no target, no rel, no glyph', () => {
		const { body } = render(Link, { props: { href: './slide-pages/title.html' } });
		expect(body).toContain('href="./slide-pages/title.html"');
		expect(body).toContain('internal');
		expect(body).not.toContain('target=');
		expect(body).not.toContain('rel=');
		expect(body).not.toContain('marker');
	});

	it('renders an external link fully formed at prerender', () => {
		const { body } = render(Link, { props: { href: 'https://codingbooth.io/' } });
		expect(body).toContain('external');
		expect(body).toContain('target="_blank"');
		expect(body).toContain('rel="noopener noreferrer"');
		expect(body).toContain('↗');
	});

	// The tone class is what the stylesheet hangs the colour and the stroke on, so an
	// internal page opened away has to carry it into the static HTML too.
	it('gives a new-window internal link the leaving tone in the static HTML', () => {
		const { body } = render(Link, { props: { href: '/_handout/slides.html', newTab: true } });
		expect(body).toContain('external');
		expect(body).toContain('target="_blank"');
		expect(body).toContain('rel="noopener"');
	});

	it('omits unset id and style rather than emitting empty attributes', () => {
		const { body } = render(Link, { props: { href: './x.html' } });
		expect(body).not.toContain('id=');
		expect(body).not.toContain('style=');
	});
});
