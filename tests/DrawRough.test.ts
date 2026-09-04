import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import DrawRoughHost from './DrawRoughHost.svelte';
import { resolveRoughness } from '$lib/draw/roughCore';
import { sharedAttrs } from '$lib/draw/editing';

// The hand-drawn option's CONTRACT, as seen through real components: who
// inherits the surface's `rough`, who overrides it, who opts back out, and
// what the copied tag has to carry so a drag doesn't silently un-roughen a
// shape. (The geometry itself is covered in roughCore.test.ts, and the
// prerender/determinism guarantee in DrawRoughSsr.ssr.test.ts.)

/** The resolved stroke colour of an element, whitespace-normalization and all
 *  (jsdom rewrites the style attribute, so raw substring matching is brittle). */
const strokeOf = (el: Element) =>
	((el as SVGElement).style?.getPropertyValue('stroke') ?? '').replace(/\s+/g, '');

const strokesOf = (c: HTMLElement, id: string) => {
	const el = c.querySelector(`#${id}`);
	return Array.from(el?.querySelectorAll('path') ?? []).map((p) => p.getAttribute('d') ?? '');
};

describe('resolveRoughness — the inheritance rule, in isolation', () => {
	it('inherits the surface default when the shape says nothing', () => {
		expect(resolveRoughness(undefined, 1.5)).toBe(1.5);
		expect(resolveRoughness(undefined, null)).toBe(null);
	});

	it('lets a shape opt OUT of an inherited default', () => {
		expect(resolveRoughness(false, 2)).toBe(null);
		expect(resolveRoughness(0, 2)).toBe(null);
	});

	it('lets a shape opt IN on a clean surface', () => {
		expect(resolveRoughness(true, null)).toBe(1);
		expect(resolveRoughness(1.5, null)).toBe(1.5);
	});

	it('treats `true` as the standard wobble and a number as the amount', () => {
		expect(resolveRoughness(true, 0.2)).toBe(1);
		expect(resolveRoughness(2, 0.2)).toBe(2);
	});

	it('ignores a non-finite roughness rather than emitting NaN geometry', () => {
		// Both coerce to 0 ("not rough") rather than reaching the geometry.
		expect(resolveRoughness(NaN, null)).toBe(null);
		expect(resolveRoughness(Infinity, null)).toBe(null);
	});
});

describe('<Draw rough> — cascade through real shapes', () => {
	it('a shape with no `rough` inherits the surface and is drawn twice', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const ds = strokesOf(container, 'inherited');
		expect(ds).toHaveLength(2);
		// Wobbled: cubic runs, not the clean `L` a machine-drawn Line emits.
		expect(ds[0]).toContain(' C ');
		expect(ds[0]).not.toBe(ds[1]);
	});

	it('rough={false} keeps that one shape machine-drawn', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const ds = strokesOf(container, 'optedOut');
		expect(ds).toEqual(['M 0 50 L 400 50']);
	});

	it('a higher roughness wobbles further than the inherited one', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const spread = (d: string) => {
			const ys = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 1);
			return Math.max(...ys) - Math.min(...ys);
		};
		expect(spread(strokesOf(container, 'stronger')[0])).toBeGreaterThan(
			spread(strokesOf(container, 'inherited')[0])
		);
	});

	it('an explicit seed changes the draw without changing the shape', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		// Same length and position as `inherited`, different wobble.
		const a = strokesOf(container, 'inherited')[0];
		const b = strokesOf(container, 'seeded')[0];
		expect(a).not.toBe(b);
		expect((a.match(/C/g) ?? []).length).toBe((b.match(/C/g) ?? []).length);
	});

	it('a clean surface leaves every shape machine-drawn', () => {
		const { container } = render(DrawRoughHost, { props: { surface: false } });
		expect(strokesOf(container, 'inherited')).toEqual(['M 0 0 L 400 0']);
		expect(container.querySelector('rect')).not.toBeNull();
	});

	it('a rough box becomes stroke groups, not a <rect>', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		expect(container.querySelector('#box')?.tagName.toLowerCase()).toBe('g');
		// Four overshooting edges per pass.
		expect(strokesOf(container, 'box')).toHaveLength(2);
		expect((strokesOf(container, 'box')[0].match(/M/g) ?? [])).toHaveLength(4);
	});

	it('a filled rough shape gets hachure strokes under its outline', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const paths = Array.from(container.querySelectorAll('#filled path'));
		// Fill first (painted under), then the outline passes.
		expect(paths.length).toBeGreaterThan(2);
		expect(strokeOf(paths[0])).toBe('#3a6ea5');
	});

	it('fillStyle="solid" keeps the flat fill and skips the hachure', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const paths = Array.from(container.querySelectorAll('#flat path'));
		// Outline passes only — no hachure strokes.
		expect(paths).toHaveLength(2);
		for (const p of paths) expect(strokeOf(p)).not.toBe('#3a6ea5');
		// …but the flat fill IS painted, on the true ellipse under the rough
		// outline: the wobbly loop is a stroke and has no fillable interior, so
		// forgetting this leaves a "filled" shape rendering empty.
		const solid = container.querySelector('#flat ellipse');
		expect(solid).not.toBeNull();
		expect(solid?.getAttribute('fill')).toBe('#3a6ea5');
	});
});

describe('<Connector> follows the surface', () => {
	// A crisp box-to-box arrow sitting among hand-drawn shapes is the one thing
	// that would give the whole effect away, so Connector inherits `rough` from
	// the Draw it is nested in like any other shape.
	it('is drawn by hand inside a rough Draw', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const ds = strokesOf(container, 'wire');
		// Two shaft passes plus the two-barb arrowhead.
		expect(ds.length).toBeGreaterThanOrEqual(3);
		expect(ds[0]).toContain(' C ');
		expect(ds[0]).not.toBe(ds[1]);
		// The head is open barbs, not a filled polygon.
		expect(container.querySelector('#wire polygon')).toBeNull();
	});

	it('honours rough={false} and stays machine-drawn', () => {
		const { container } = render(DrawRoughHost, { props: {} });
		const ds = strokesOf(container, 'wireCrisp');
		expect(ds).toHaveLength(1);
		expect(ds[0]).not.toContain(' C ');
		// …and keeps its filled-triangle head.
		expect(container.querySelector('#wireCrisp polygon')).not.toBeNull();
	});

	it('stays machine-drawn on a clean surface', () => {
		const { container } = render(DrawRoughHost, { props: { surface: false } });
		expect(strokesOf(container, 'wire')).toHaveLength(1);
	});
});

describe('the copied tag carries the hand-drawn props', () => {
	// This is the one that actually bites: ADJUST's Copy emits a WHOLE opening
	// tag which the author pastes OVER their own. Anything sharedAttrs forgets is
	// DELETED from their slide by the act of dragging the shape — so a dragged
	// rough shape would silently come back machine-drawn.
	it('emits `rough` in each of its three meaningful forms', () => {
		expect(sharedAttrs({ rough: true })).toBe(' rough');
		expect(sharedAttrs({ rough: 1.5 })).toBe(' rough={1.5}');
		// `rough={false}` is NOT a no-op — it opts a shape out of an inherited
		// <Draw rough>, so dropping it would re-roughen the shape on drag.
		expect(sharedAttrs({ rough: false })).toBe(' rough={false}');
	});

	it('emits an explicit seed, so the same draw comes back', () => {
		expect(sharedAttrs({ seed: 42 })).toBe(' seed={42}');
	});

	it('stays byte-for-byte empty for a shape that never asked for it', () => {
		expect(sharedAttrs({})).toBe('');
		expect(sharedAttrs({ rough: undefined, seed: undefined })).toBe('');
	});
});
