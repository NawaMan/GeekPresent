// @vitest-environment node
//
// True server-side render of the ContentPage template (svelte/server, no DOM).
// The header is pure props → markup, which is what prerendering a slide does, so
// the whole contract is assertable here: each of the three header parts (title,
// subtitle, rule) is independently omittable, an absent header leaves NO element
// behind (the point of the change — an empty <span> used to keep its margins),
// and `align` reaches the markup.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ContentPage from '../src/lib/templates/ContentPage.svelte';

// Class attributes carry Svelte's scoping hash (class="rule svelte-1abc2de"), so
// match the opening of the attribute rather than the whole value.
const hasTitle    = (body: string) => body.includes('<h1');
const hasSubtitle = (body: string) => body.includes('class="subtitle');
const hasRule     = (body: string) => body.includes('class="rule');
const hasHeader   = (body: string) => body.includes('<header');

describe('ContentPage header (SSR)', () => {
	it('renders title, subtitle and rule by default — the stock slide', () => {
		const { body } = render(ContentPage, { props: { title: 'T', subtitle: 'S' } });
		expect(body).toContain('>T</h1>');
		expect(body).toContain('>S</span>');
		expect(hasRule(body)).toBe(true);
		expect(hasHeader(body)).toBe(true);
	});

	it('omitting the subtitle drops its element, keeping the title and rule', () => {
		const { body } = render(ContentPage, { props: { title: 'T' } });
		expect(hasTitle(body)).toBe(true);
		expect(hasSubtitle(body)).toBe(false);
		expect(hasRule(body)).toBe(true);
	});

	it('omitting the title drops its element, keeping the subtitle and rule', () => {
		const { body } = render(ContentPage, { props: { subtitle: 'S' } });
		expect(hasTitle(body)).toBe(false);
		expect(hasSubtitle(body)).toBe(true);
		expect(hasRule(body)).toBe(true);
	});

	it('rule={false} drops the rule, keeping title and subtitle', () => {
		const { body } = render(ContentPage, { props: { title: 'T', subtitle: 'S', rule: false } });
		expect(hasTitle(body)).toBe(true);
		expect(hasSubtitle(body)).toBe(true);
		expect(hasRule(body)).toBe(false);
	});

	it('no title, no subtitle, no rule → no header element at all', () => {
		const { body } = render(ContentPage, { props: { rule: false } });
		expect(hasHeader(body)).toBe(false);
		// The content box survives — a headerless slide is still a slide.
		expect(body).toContain('class="content');
	});

	it('a bare rule is still a header (an author may want just the divider)', () => {
		const { body } = render(ContentPage, { props: {} });
		expect(hasHeader(body)).toBe(true);
		expect(hasRule(body)).toBe(true);
		expect(hasTitle(body)).toBe(false);
		expect(hasSubtitle(body)).toBe(false);
	});

	it('align defaults to left and opts in to centered', () => {
		const left = render(ContentPage, { props: { title: 'T' } });
		expect(left.body).not.toContain('centered');
		const center = render(ContentPage, { props: { title: 'T', align: 'center' } });
		expect(center.body).toContain('centered');
	});
});

// The pager is part of the template — a slide should not have to remember to add one.
// The exception is a slide with no neighbours to page to, which supplies its own way
// out instead: an AppendixPage builds on ContentPage and drops the bar to do exactly
// that (see templates/AppendixPage.svelte). Without this seam it would have had to
// reimplement the page, or ship two nav bars.
describe('ContentPage nav (SSR)', () => {
	it('carries the pager by default', () => {
		const { body } = render(ContentPage, { props: { title: 'T' } });
		expect(body).toContain('>NEXT<');
		expect(body).toContain('>PREV<');
	});

	it('nav={false} drops it, keeping the page itself intact', () => {
		const { body } = render(ContentPage, { props: { title: 'T', nav: false } });
		expect(body).not.toContain('>NEXT<');
		expect(body).not.toContain('>PREV<');
		expect(body).toContain('>T</h1>');
		expect(body).toContain('class="content');
	});
});
