import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

// The hand-lettered label face. This is CSS + two binary assets, so nothing
// else in the suite would notice if a file were dropped, renamed, or shipped
// without its licence — the failure mode is silent (labels quietly fall back to
// whatever handwriting font the viewer happens to have, which is often none).

const root = resolve(__dirname, '..');
const css = () => readFileSync(resolve(root, 'src/lib/styles/global.css'), 'utf8');
const bytes = (p: string) => statSync(resolve(root, p)).size;

const FILES = [
	'static/fonts/Excalifont-Regular-latin.woff2',
	'static/fonts/Excalifont-Regular-latin-ext.woff2'
];

describe('Excalifont — the bundled hand-lettering face', () => {
	it('ships both Latin subsets, and they are real woff2', () => {
		for (const f of FILES) {
			const buf = readFileSync(resolve(root, f));
			// woff2 files start with the signature 'wOF2'.
			expect(buf.subarray(0, 4).toString('latin1')).toBe('wOF2');
			expect(buf.length).toBeGreaterThan(1000);
		}
	});

	it('stays small — a slide font is not a place to spend a megabyte', () => {
		const total = FILES.reduce((n, f) => n + bytes(f), 0);
		expect(total).toBeLessThan(120_000);
	});

	it('is @font-face-d under the name the label stack asks for', () => {
		const s = css();
		expect(s).toContain("font-family: 'Excalifont'");
		for (const f of FILES) expect(s).toContain(f.replace('static', ''));
	});

	it('declares unicode-range on both faces, so an English deck fetches one file', () => {
		// Without the ranges the browser downloads both subsets for every deck.
		const faces = css().match(/@font-face\s*\{[^}]*Excalifont[^}]*\}/g) ?? [];
		expect(faces).toHaveLength(2);
		for (const f of faces) expect(f).toContain('unicode-range:');
	});

	it('uses font-display: swap, so a slide never blocks on the font', () => {
		const faces = css().match(/@font-face\s*\{[^}]*Excalifont[^}]*\}/g) ?? [];
		for (const f of faces) expect(f).toContain('font-display: swap');
	});

	it('names Excalifont first in the rough label stack', () => {
		// .draw-label.hand's var() fallback is what actually selects the face —
		// there is no :root override — so the name has to lead it.
		const line = readFileSync(resolve(root, 'src/lib/draw/Line.svelte'), 'utf8');
		const stack = line.slice(line.indexOf('.draw-label.hand'));
		expect(stack).toContain('--draw-font-family');
		expect(stack.indexOf("'Excalifont'")).toBeLessThan(stack.indexOf('cursive'));
	});

	it('carries its licence, as the OFL requires', () => {
		const lic = readFileSync(resolve(root, 'static/fonts/Excalifont-OFL.txt'), 'utf8');
		expect(lic).toContain('SIL OPEN FONT LICENSE Version 1.1');
		expect(lic).toContain('PERMISSION & CONDITIONS');
		expect(lic).toContain('Excalidraw');
	});
});
