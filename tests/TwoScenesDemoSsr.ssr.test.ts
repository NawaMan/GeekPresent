// @vitest-environment node
//
// The two-scenes slide (now in the /animation deck) earns its place by demonstrating TWO
// independent animation controls on one canvas: each region carries its own <AnimationBar>
// scoped to that region alone. This test pins the two properties a careless edit could quietly
// break — collapsing it back into an ordinary one-bar slide:
//
//   1. Source: two AnimationBars, scoped to `.set-a` and `.set-b` — DISTINCT scopes, so the bars
//      collect getAnimations() from their own region and never fight over each other's timeline.
//   2. SSR: the whole slide (ContentPage + two <Draw> regions of Sprite/Line/Curve) prerenders
//      through svelte/server without throwing, and bakes NO NaN / undefined into the markup — the
//      same SSR-safety the Draw family is held to elsewhere.
import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import TwoScenes from '../src/routes/animation/two-scenes.html/+page.svelte';

const SRC = 'src/routes/animation/two-scenes.html/+page.svelte';

describe('two-scenes demo — two independent bars', () => {
	const source = readFileSync(SRC, 'utf8');

	it('authors two AnimationBars scoped to their own regions', () => {
		// Require the real self-closing tag so the `<AnimationBar scope=".set-x">` example
		// in the file's header comment (not self-closed) doesn't count as a third bar.
		const scopes = [...source.matchAll(/<AnimationBar\s+scope="([^"]+)"[^>]*\/>/g)].map(
			(m) => m[1]
		);
		expect(scopes).toHaveLength(2);
		// Distinct region scopes are the whole point — one shared scope would merge the timelines.
		expect(new Set(scopes)).toEqual(new Set(['.set-a', '.set-b']));
		// And each scope matches a real positioned region the bar can anchor to.
		expect(source).toContain('class="anim-set set-a"');
		expect(source).toContain('class="anim-set set-b"');
	});
});

describe('two-scenes demo (SSR)', () => {
	it('prerenders both regions with no NaN or undefined in the markup', () => {
		let body = '';
		expect(() => ({ body } = render(TwoScenes, { props: {} }))).not.toThrow();
		expect(body).toContain('set-a');
		expect(body).toContain('set-b');
		expect(body).not.toContain('NaN');
		expect(body).not.toContain('undefined');
	});
});
