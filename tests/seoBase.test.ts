// A site served below the domain root (a GitHub project page at /GeekPresent/) has the base
// path in every page's pathname AND at the end of SITE_URL. The canonical / og:url join must
// carry it once, not twice.
import { describe, expect, it } from 'vitest';
import { absoluteUrl, stripBase } from '$lib/seo/config';

describe('stripBase', () => {
	it('leaves the pathname alone when there is no base', () => {
		expect(stripBase('/slides/title.html', '')).toBe('/slides/title.html');
		expect(stripBase('/', '')).toBe('/');
	});

	it('takes the base off a page under it', () => {
		expect(stripBase('/GeekPresent/slides/title.html', '/GeekPresent')).toBe('/slides/title.html');
		expect(stripBase('/GeekPresent/', '/GeekPresent')).toBe('/');
	});

	it('maps the bare base to the root', () => {
		expect(stripBase('/GeekPresent', '/GeekPresent')).toBe('/');
	});

	it('only strips a whole segment', () => {
		expect(stripBase('/GeekPresentation/a.html', '/GeekPresent')).toBe('/GeekPresentation/a.html');
	});

	it('returns a pathname outside the base as it is', () => {
		expect(stripBase('/other/a.html', '/GeekPresent')).toBe('/other/a.html');
	});

	it('joins to SITE_URL without repeating the base', () => {
		// The test configs pin SITE_URL to https://example.test.
		expect(absoluteUrl(stripBase('/GeekPresent/slides/a.html', '/GeekPresent'))).toBe(
			'https://example.test/slides/a.html'
		);
	});
});
