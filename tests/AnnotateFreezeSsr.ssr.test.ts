// @vitest-environment node
//
// The FREEZE demo slide, proven through svelte/server — built deck HTML never contains
// slide markup, so prerender has to be shown here rather than by grepping docs/.
//
// The second half is the one that would actually catch a regression: an END-TO-END freeze
// against this slide's REAL source. A stroke goes through the same mapping the bar uses,
// and the resulting markup through the same patcher the dev endpoint calls, onto the actual
// bytes on disk. The two halves of this feature — the mapping and the insert — are written
// in different files and tested separately; this is the test that says they compose, and
// that the slide the feature documents is one the feature can actually write to.
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Slide from '../src/routes/slides/annotate-freeze.html/+page.svelte';
import { patchSlideSource } from '../src/lib/adjust/patchSource';
import { freezeImport, freezeTags } from '../src/lib/annotate/freezeCore';
import type { Stroke } from '../src/lib/annotate/annotateCore';

const FILE = 'src/routes/slides/annotate-freeze.html/+page.svelte';

describe('Annotate — FREEZE demo slide (SSR)', () => {
	it('prerenders its prose and its targets', () => {
		const { body } = render(Slide, { props: {} });
		expect(body).toContain('Freeze');
		expect(body).toContain('The one mark');
		// The Blocks a speaker is invited to draw on. Asserted by their CONTENT, not their
		// `name` — a Block's name is an ADJUST/anchor identifier and never reaches the DOM.
		expect(body).toContain('is the number that matters');
		expect(body).toContain('every request pays it');
		// And the mapping the slide documents, which is the thing a reader came for.
		expect(body).toContain('a fat, translucent');
	});

	it('ships no ink chrome of its own — the pen is a client-side singleton', () => {
		// The slide teaches FREEZE but must not PRERENDER it: <Annotate> is mounted once by
		// SlideDeck, in the browser, and a demo slide that shipped its own surface would put
		// a dead pointer-eating overlay into the static page.
		const { body } = render(Slide, { props: {} });
		expect(body).not.toContain('annot-surface');
		expect(body).not.toContain('annot-bar');
		expect(body).not.toContain('freeze-go');
	});
});

describe('FREEZE end-to-end — a stroke into this slide’s real source', () => {
	/** What the speaker drew: a ring round the term, and a straight underline. */
	const drawn: Stroke[] = [
		{ id: 'ring', tool: 'pen', points: [[1200, 400], [1400, 380], [1500, 430], [1200, 400]] },
		{ id: 'rule', tool: 'line', points: [[1120, 600], [1800, 600]], color: '#E5484D' }
	];

	it('maps, imports and inserts — the whole path, onto the bytes on disk', () => {
		const source = readFileSync(FILE, 'utf8');
		const tags = freezeTags(drawn, ['ring', 'rule']);
		expect(tags).toHaveLength(2);

		const importLine = freezeImport(tags);
		const names = /\{([^}]*)\}/.exec(importLine)![1].split(',').map((s) => s.trim());

		const { source: next, patched, unmatched } = patchSlideSource(source, [
			{ kind: 'Draw', insert: tags.join('\n'), insertImports: names }
		]);

		expect(unmatched).toHaveLength(0);
		expect(patched).toHaveLength(1);

		// The shapes landed…
		expect(next).toContain('<Polyline');
		expect(next).toContain('<Line from={[1120, 600]} to={[1800, 600]}');
		// …the chosen colour came with the one that had one, and the untinted one stayed
		// untinted so --draw-stroke keeps painting it.
		expect(next).toContain('color="#E5484D"');
		expect(next.match(/color="#E5484D"/g)).toHaveLength(1);
		// …inside a <Draw>, without which neither shape would render at all…
		expect(next).toMatch(/<Draw>[\s\S]*<Polyline[\s\S]*<\/Draw>/);
		// …and the import that makes them compile.
		expect(next).toContain("from '$lib/draw'");
		expect(next).toContain('Draw');
		expect(next).toContain('Line');
		expect(next).toContain('Polyline');

		// Nothing the slide already said was disturbed.
		expect(next).toContain('const path =');
		expect(next).toContain('<ViewSource {source} {path} />');
	});

	it('leaves the slide on disk alone — the patcher is pure', () => {
		// patchSlideSource RETURNS a new string; only the dev endpoint writes. Worth pinning:
		// a patcher that wrote as a side effect would rewrite the repo from a test run.
		const before = readFileSync(FILE, 'utf8');
		patchSlideSource(before, [{ kind: 'Draw', insert: freezeTags(drawn, ['ring']).join('\n') }]);
		expect(readFileSync(FILE, 'utf8')).toBe(before);
	});
});
