// preloadCore — which neighbouring slides Chrome is asked to preload.
import { describe, expect, it } from 'vitest';
import { neighbourUrls, speculationRules } from '$lib/utils/preloadCore';

describe('neighbourUrls', () => {
	it('names next then previous, exactly as the pager links them', () => {
		expect(neighbourUrls({ prev: './a.html', next: './c.html' }, false)).toEqual(['./c.html', './a.html']);
	});

	it('keeps the console a console, as NavigationBar does', () => {
		expect(neighbourUrls({ prev: './a.html', next: './c.html?return=b.html' }, true)).toEqual([
			'./c.html?return=b.html&present',
			'./a.html?present'
		]);
	});

	it('skips a missing end, and a duplicate', () => {
		expect(neighbourUrls({ next: './b.html' }, false)).toEqual(['./b.html']);
		expect(neighbourUrls({ prev: './b.html', next: './b.html' }, false)).toEqual(['./b.html']);
		expect(neighbourUrls({}, false)).toEqual([]);
	});
});

describe('speculationRules', () => {
	it('is a prerender list, or nothing at all', () => {
		expect(JSON.parse(speculationRules(['./b.html']))).toEqual({
			prerender: [{ source: 'list', urls: ['./b.html'], eagerness: 'immediate' }]
		});
		expect(speculationRules([])).toBe('');
	});
});
