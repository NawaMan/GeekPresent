// @vitest-environment node
//
// True server-side render of the hand-drawn (rough) option (svelte/server, no
// DOM). Two things are being proved here, and only an SSR render can prove
// them:
//
//  1. The wobble is computed from PROPS ALONE, so a prerendered slide already
//     contains its finished hand-drawn markup — no JS, no layout, no measuring.
//  2. It is DETERMINISTIC. The server and the browser must produce byte-identical
//     `d` strings or hydration mismatches, and the shape visibly snaps on load.
//     Rendering the same host twice and comparing the bytes is the test for that.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import DrawRoughSsrHost from './DrawRoughSsrHost.svelte';

const html = () => render(DrawRoughSsrHost, { props: {} }).body;

describe('Draw rough (SSR)', () => {
	it('renders the hand-drawn markup server-side from props alone', () => {
		const body = html();
		expect(body).toContain('viewBox="0 0 1920 1080"');
		expect(body).toContain('<title>Hand-drawn flow</title>');
		// Wobbled strokes are cubic runs, not the straight `L` a clean Line emits.
		expect(body).toMatch(/d="M [\d.-]+ [\d.-]+ C /);
	});

	it('is deterministic — the same geometry twice, which is what hydration needs', () => {
		// Two things in the markup legitimately differ between two renders in ONE
		// process and are nothing to do with the wobble: `newEditorId()` is a
		// module-global counter (so animation names climb), and Svelte's {@html}
		// marker comments hash the content those names sit in. A real
		// server→browser handoff is two fresh processes, where both restart.
		// Normalize them away; everything left is geometry, and THAT must match
		// byte for byte or the shape snaps on hydration.
		const norm = (s: string) =>
			s.replace(/draw-move-\d+/g, 'draw-move-N').replace(/<!--[a-z0-9]{6,}-->/g, '<!--h-->');
		expect(norm(html())).toBe(norm(html()));
	});

	it('the normalizer above cannot hide a geometry difference', () => {
		// Guards the test above: if `norm` were too aggressive it would mask the
		// very thing this file exists to check.
		const norm = (s: string) =>
			s.replace(/draw-move-\d+/g, 'draw-move-N').replace(/<!--[a-z0-9]{6,}-->/g, '<!--h-->');
		expect(norm('d="M 1450 199.93"')).not.toBe(norm('d="M 1450 199.94"'));
	});

	it('draws each rough stroke twice, as a hand does', () => {
		// The doubled line is the signature. Two <path>s carry the request line's
		// shaft; a machine-drawn one would have exactly one.
		const body = html();
		const paths = body.match(/<path/g) ?? [];
		// 7 shapes × 2 passes, plus fills, heads and the crisp opt-out.
		expect(paths.length).toBeGreaterThan(14);
	});

	it('honours rough={false} — that shape stays machine-drawn', () => {
		// The opted-out Line keeps its exact straight `d`, wobble-free.
		expect(html()).toContain('d="M 200 260 L 900 260"');
	});

	it('keeps a clean <rect>/<ellipse> only for shapes that are not rough', () => {
		const body = html();
		// Every box on this surface is rough, so no bare <rect> survives; the
		// solid-filled Ellipse is still rough in OUTLINE, just not in fill.
		expect(body).not.toContain('<rect ');
	});

	it('emits hachure fill strokes for a filled rough box', () => {
		// The hatched Rect's fill is stroked line work in the fill colour.
		expect(html()).toContain('stroke:#3a6ea5');
	});

	it('gives an animated rough shape one keyframe set PER PASS', () => {
		// Each pass is its own <path> and needs its own `d: path()` track, or the
		// passes would tween through each other's geometry.
		const body = html();
		expect(body).toMatch(/@keyframes draw-move-\d+-p0/);
		expect(body).toMatch(/@keyframes draw-move-\d+-p1/);
	});

	it('still prerenders the draw-on reveal plumbing', () => {
		const body = html();
		expect(body).toContain('pathLength="1"');
		expect(body).toContain('animation-duration:1.5s');
	});

	it('hand-letters the label on a rough shape', () => {
		const body = html();
		expect(body).toContain('>request</text>');
		expect(body).toMatch(/class="[^"]*\bhand\b/);
	});

	it('never emits NaN into the markup', () => {
		expect(html()).not.toMatch(/NaN/);
	});
});
