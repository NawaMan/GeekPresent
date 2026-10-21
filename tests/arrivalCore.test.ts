import { describe, expect, it } from 'vitest';
import { arrivalMark, arrivesAtEnd, normalizePath, ARRIVAL_MAX_AGE_MS } from '../src/lib/utils/arrivalCore';

// The note PREV leaves for the slide it pages to, so that slide's <Steps> build
// opens spent. Read from sessionStorage, i.e. untrusted: junk must read as "no".

const base = 'http://localhost/deck/c.html';

describe('arrivalCore', () => {
	it('resolves the target against the current page and drops trailing slashes', () => {
		expect(JSON.parse(arrivalMark('./b.html', base, 5)!)).toEqual({ path: '/deck/b.html', at: 5 });
		expect(JSON.parse(arrivalMark('/deck/b.html/?present', base, 5)!).path).toBe('/deck/b.html');
		expect(normalizePath('/')).toBe('/');
	});

	it('a fresh mark for this slide says yes', () => {
		const mark = arrivalMark('b.html', base, 1000);
		expect(arrivesAtEnd(mark, '/deck/b.html', 1500)).toBe(true);
		expect(arrivesAtEnd(mark, '/deck/b.html/', 1500)).toBe(true);
	});

	it('another slide, a stale mark, or one from the future says no', () => {
		const mark = arrivalMark('b.html', base, 1000);
		expect(arrivesAtEnd(mark, '/deck/a.html', 1500)).toBe(false);
		expect(arrivesAtEnd(mark, '/deck/b.html', 1000 + ARRIVAL_MAX_AGE_MS + 1)).toBe(false);
		expect(arrivesAtEnd(mark, '/deck/b.html', 999)).toBe(false);
	});

	it('junk says no', () => {
		for (const raw of [null, '', 'nope', '42', 'null', '{"path":1,"at":1}', '{"path":"/deck/b.html"}'])
			expect(arrivesAtEnd(raw, '/deck/b.html', 1)).toBe(false);
	});
});
