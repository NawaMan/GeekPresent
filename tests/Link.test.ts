import { render, screen, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Link from '$lib/components/Link.svelte';

// Link — the one anchor a slide should write. linkCore already proves the
// classification; what is tested here is that the component TELLS THE TRUTH in the
// DOM: the tone class, the kind glyph, and the target/rel that must not drift from
// them. Every link shares one colour and one dashed underline, so the glyph is the
// only visible difference between an internal link and an external one.

afterEach(() => cleanup());

const link = () => screen.getByRole('link');
const tone = (el: Element) => (el.classList.contains('external') ? 'external' : 'internal');

describe('Link — an internal destination', () => {
	it('wears the staying tone, with no target and no rel', () => {
		render(Link, { props: { href: './slide-pages/title.html' } });
		expect(tone(link())).toBe('internal');
		expect(link().getAttribute('target')).toBeNull();
		expect(link().getAttribute('rel')).toBeNull();
	});

	it('is left unmarked — no glyph at all', () => {
		const { container } = render(Link, { props: { href: '../' } });
		expect(container.querySelector('.marker')).toBeNull();
	});
});

describe('Link — an external destination', () => {
	it('wears the leaving tone and opens away, guarded', () => {
		render(Link, { props: { href: 'https://codingbooth.io/' } });
		expect(tone(link())).toBe('external');
		expect(link().getAttribute('target')).toBe('_blank');
		expect(link().getAttribute('rel')).toBe('noopener noreferrer');
	});

	// aria-hidden even though the glyph carries real meaning: a screen reader already
	// announces the destination from the href, so reading "↗" aloud would be noise.
	it('marks itself with a ↗ the screen reader does not announce', () => {
		const { container } = render(Link, { props: { href: 'https://example.com' } });
		const marker = container.querySelector('.marker');
		expect(marker?.textContent).toBe('↗');
		expect(marker?.getAttribute('aria-hidden')).toBe('true');
	});

	it('drops the glyph on glyph={false} but keeps the tone and the guards', () => {
		render(Link, { props: { href: 'https://example.com', glyph: false } });
		expect(tone(link())).toBe('external');
		expect(link().textContent).not.toContain('↗');
		expect(link().getAttribute('rel')).toBe('noopener noreferrer');
	});

	it('lets an explicit icon override the kind glyph', () => {
		render(Link, { props: { href: 'https://example.com', icon: '⇱' } });
		expect(link().textContent).toContain('⇱');
		expect(link().textContent).not.toContain('↗');
	});
});

describe('Link — the author overrides', () => {
	it('honours kind="internal" on an absolute URL', () => {
		render(Link, { props: { href: 'https://example.com', kind: 'internal' } });
		expect(tone(link())).toBe('internal');
		expect(link().getAttribute('target')).toBeNull();
	});

	// An internal page deliberately opened away: the reader ends up in another window,
	// so it must LOOK like leaving even though the URL is ours.
	it('gives an internal page forced into a new window the leaving look', () => {
		render(Link, { props: { href: '/_handout/slides.html', newTab: true } });
		expect(tone(link())).toBe('external');
		expect(link().getAttribute('target')).toBe('_blank');
		expect(link().getAttribute('rel')).toBe('noopener');
	});

	it('treats a same-origin absolute URL as internal when given the origin', () => {
		render(Link, {
			props: { href: 'https://geek.example/a.html', origin: 'https://geek.example' }
		});
		expect(tone(link())).toBe('internal');
	});
});

describe('Link — the standard three props', () => {
	it('passes style, id and class through to the anchor', () => {
		render(Link, {
			props: { href: './x.html', style: 'opacity: 0.5;', id: 'go', class: 'quiet' }
		});
		expect(link().getAttribute('id')).toBe('go');
		expect(link().getAttribute('style')).toBe('opacity: 0.5;');
		expect(link().classList.contains('quiet')).toBe(true);
	});

	// `id={id || undefined}` — an unset id must emit no attribute at all, rather than
	// littering the DOM with id="".
	it('emits no id or style attribute when they are unset', () => {
		render(Link, { props: { href: './x.html' } });
		expect(link().hasAttribute('id')).toBe(false);
		expect(link().hasAttribute('style')).toBe(false);
	});

	// A junk href must not throw or invent a destination — it just stays home.
	it('survives a missing href', () => {
		const { container } = render(Link, { props: {} });
		const anchor = container.querySelector('a');
		expect(anchor).not.toBeNull();
		expect(tone(anchor as Element)).toBe('internal');
	});
});
