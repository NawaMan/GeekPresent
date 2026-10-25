// A relative link that climbs ABOVE the site root (`../../portrait/` from `/unique/x.html`)
// works on a root deploy — the browser clamps it at `/` — and breaks under a base path,
// where it leaves `/GeekPresent/` for the domain root. The build only catches it when it is
// run with GEEKPRESENT_BASE_PATH, so this checks every page's source for it instead.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROUTES = 'src/routes';

function pages(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return pages(p);
		return e.name === '+page.svelte' ? [p] : [];
	});
}

/** How many `../` a page may use: the folders between its URL and the site root. A route
    group `(name)` is not part of the URL; the last segment is the page itself. */
function allowedClimb(file: string): number {
	const segs = relative(ROUTES, join(file, '..'))
		.split(sep)
		.filter((s) => s && !/^\(.*\)$/.test(s));
	return Math.max(0, segs.length - 1);
}

describe('relative links stay inside the site', () => {
	for (const file of pages(ROUTES)) {
		it(file, () => {
			const src = readFileSync(file, 'utf8');
			const max = allowedClimb(file);
			const over = [...src.matchAll(/(?:href|to)="((?:\.\.\/)+)[^"]*"/g)]
				.filter((m) => m[1].length / 3 > max)
				.map((m) => m[0]);
			expect(over).toEqual([]);
		});
	}
});
