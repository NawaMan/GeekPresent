// @vitest-environment node
//
// The ADJUST "Save" button rewrites a Draw shape by finding its tag as an
// EXACT literal string in the slide source (patchSource: indexOf(oldTag)). So
// the demo's <Path> tags must sit in source on ONE line, in the canonical form
// Copy emits — otherwise a drag → Save is silently "unmatched" and reverts on
// reload. We extract the tags from source (robust to coordinate edits made via
// Save itself) and prove each is single-line, canonical, and locatable by the
// patcher.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { patchSlideSource } from '../src/lib/adjust/patchSource';

// Both demos that author a <Path> element (the static/reveal deck and the
// scrubbing animation demo). Each maps a shape `name` → the file it lives in.
const DEMOS: Record<string, string> = {
	flow: 'src/routes/slides/path-component.html/+page.svelte',
	wave: 'src/routes/slides/path-component.html/+page.svelte',
	route: 'src/routes/animation/path-move.html/+page.svelte'
};

/** The single-line `<Path name="…" … />` element for a given name. `[^\n]` keeps
 *  the match on one line, which is the whole point — a multi-line tag wouldn't
 *  match and Save couldn't find it. */
const tagOf = (name: string) => {
	const src = readFileSync(DEMOS[name], 'utf8');
	return src.match(new RegExp(`<Path name="${name}"[^\\n]*?/>`))?.[0];
};

describe('Path demo — ADJUST Save round-trip', () => {
	it('authors each <Path> as a single-line, canonical tag', () => {
		for (const name of Object.keys(DEMOS)) {
			const tag = tagOf(name);
			expect(tag, `${name} tag`).toBeTruthy();
			expect(tag).not.toContain('\n');
			// Canonical order Copy emits: name → start → segments → shared attrs.
			expect(tag).toMatch(new RegExp(`^<Path name="${name}" start=\\{\\[.*\\]\\} segments=\\{\\[`));
		}
	});

	it('Save can locate and rewrite a demo Path in place (not "unmatched")', () => {
		for (const name of Object.keys(DEMOS)) {
			const src = readFileSync(DEMOS[name], 'utf8');
			const tag = tagOf(name)!;
			// Simulate a drag that nudged the start, as Draw would report it.
			const newTag = tag.replace(/start=\{\[[^\]]*\]\}/, 'start={[240, 600]}');
			const { patched, unmatched, source } = patchSlideSource(src, [
				{ kind: 'Path', name, oldTag: tag, newTag }
			]);
			expect(unmatched, `${name} unmatched`).toHaveLength(0);
			expect(patched).toHaveLength(1);
			expect(source).toContain('start={[240, 600]}');
		}
	});
});
