import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	routeToDir,
	routeToPageFile,
	resolveSlideDir,
	isRouteGroupSegment
} from '../src/lib/adjust/routeToPage';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('routeToDir', () => {
	it('strips a leading slash and trailing slash', () => {
		expect(routeToDir('/slides/title.html', '/')).toBe('slides/title.html');
		expect(routeToDir('/slides/title.html/', '/')).toBe('slides/title.html');
	});

	it('drops query and hash', () => {
		expect(routeToDir('/slides/title.html?adjust', '/')).toBe('slides/title.html');
		expect(routeToDir('/slides/title.html#x', '/')).toBe('slides/title.html');
	});

	it('strips kit base', () => {
		expect(routeToDir('/talks/slides/title.html', '/talks')).toBe('slides/title.html');
	});

	it('rejects empty / traversal / empty segments', () => {
		expect(routeToDir('/', '/')).toBeNull();
		expect(routeToDir('/../secret', '/')).toBeNull();
		expect(routeToDir('/slides/../etc', '/')).toBeNull();
		expect(routeToDir('/slides//title.html', '/')).toBeNull();
		expect(routeToDir('/slides/./title.html', '/')).toBeNull();
	});
});

describe('isRouteGroupSegment', () => {
	it('accepts (hub)-style names only', () => {
		expect(isRouteGroupSegment('(hub)')).toBe(true);
		expect(isRouteGroupSegment('(group-name)')).toBe(true);
		expect(isRouteGroupSegment('hub')).toBe(false);
		expect(isRouteGroupSegment('(a/b)')).toBe(false);
		expect(isRouteGroupSegment('')).toBe(false);
	});
});

describe('resolveSlideDir', () => {
	it('walks through a route group without consuming a URL segment', () => {
		// Synthetic tree: routes/(hub)/how-to.html/+page.svelte
		const dirs = new Set([
			'/routes',
			'/routes/(hub)',
			'/routes/(hub)/how-to.html',
			'/routes/(hub)/title.html'
		]);
		const children: Record<string, string[]> = {
			'/routes': ['(hub)'],
			'/routes/(hub)': ['how-to.html', 'title.html'],
			'/routes/(hub)/how-to.html': ['+page.svelte'],
			'/routes/(hub)/title.html': ['+page.svelte']
		};
		const io = {
			readdir: (dir: string) => children[dir] ?? [],
			isDir: (p: string) => dirs.has(p),
			hasPage: (dir: string) => (children[dir] ?? []).includes('+page.svelte')
		};
		expect(resolveSlideDir('/routes', ['how-to.html'], io)).toBe('/routes/(hub)/how-to.html');
		expect(resolveSlideDir('/routes', ['missing.html'], io)).toBeNull();
	});
});

describe('routeToPageFile', () => {
	it('maps a top-level deck slide', () => {
		const file = routeToPageFile('/slides/title.html', '/', root);
		expect(file).toBe(path.join(root, 'src/routes/slides/title.html/+page.svelte'));
	});

	it('maps a hub slide behind references/(hub)', () => {
		// URL has no (hub); the file does.
		const file = routeToPageFile('/references/how-to.html', '/', root);
		expect(file).toBe(
			path.join(root, 'src/routes/references/(hub)/how-to.html/+page.svelte')
		);
	});

	it('maps a nested group deck without a route group', () => {
		const file = routeToPageFile('/references/shell/titlepage.html', '/', root);
		expect(file).toBe(
			path.join(root, 'src/routes/references/shell/titlepage.html/+page.svelte')
		);
	});

	it('rejects traversal', () => {
		expect(routeToPageFile('/../x', '/', root)).toBeNull();
		expect(routeToPageFile('/', '/', root)).toBeNull();
	});
});
