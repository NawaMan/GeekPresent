import { describe, expect, it } from 'vitest';
import {
	pathsFromPagesFile,
	slideModulePath,
	slideSitePath,
	stripRouteGroups
} from '../src/lib/handout/deckPathCore';

describe('stripRouteGroups', () => {
	it('removes (group) segments', () => {
		expect(stripRouteGroups('references/(hub)')).toBe('references');
		expect(stripRouteGroups('references/(hub)/extra')).toBe('references/extra');
	});

	it('leaves plain paths alone', () => {
		expect(stripRouteGroups('slides')).toBe('slides');
		expect(stripRouteGroups('references/shell')).toBe('references/shell');
	});

	it('tolerates junk', () => {
		expect(stripRouteGroups('')).toBe('');
		expect(stripRouteGroups(null as unknown as string)).toBe('');
	});
});

describe('pathsFromPagesFile', () => {
	it('maps a top-level deck', () => {
		expect(pathsFromPagesFile('/src/routes/slides/pages.ts')).toEqual({
			id: 'slides',
			fsPath: 'slides',
			urlPath: 'slides'
		});
	});

	it('maps a nested group deck', () => {
		expect(pathsFromPagesFile('/src/routes/references/shell/pages.ts')).toEqual({
			id: 'references-shell',
			fsPath: 'references/shell',
			urlPath: 'references/shell'
		});
	});

	it('maps a hub behind a route group', () => {
		expect(pathsFromPagesFile('/src/routes/references/(hub)/pages.ts')).toEqual({
			id: 'references',
			fsPath: 'references/(hub)',
			urlPath: 'references'
		});
	});

	it('rejects handout-ish and invalid paths', () => {
		expect(pathsFromPagesFile('/src/routes/_handout/pages.ts')).toBeNull();
		expect(pathsFromPagesFile('/src/routes/slides/title.html/pages.ts')).toBeNull();
		expect(pathsFromPagesFile('')).toBeNull();
		expect(pathsFromPagesFile('/not/routes/pages.ts')).toBeNull();
	});
});

describe('slideModulePath / slideSitePath', () => {
	it('builds module and site paths', () => {
		expect(slideModulePath('references/shell', 'block.html')).toBe(
			'/src/routes/references/shell/block.html/+page.svelte'
		);
		expect(slideModulePath('references/(hub)', 'title.html')).toBe(
			'/src/routes/references/(hub)/title.html/+page.svelte'
		);
		expect(slideSitePath('references/shell', 'block.html')).toBe(
			'/references/shell/block.html'
		);
		expect(slideSitePath('references', 'shell.html')).toBe('/references/shell.html');
	});
});
