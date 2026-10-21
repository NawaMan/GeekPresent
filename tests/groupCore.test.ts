import { describe, expect, it } from 'vitest';
import {
	IDENTITY,
	NOTHING_HIDDEN,
	childHide,
	isHidden,
	morphName,
	morphRules,
	compose,
	focusFrame,
	mapBox,
	padBox,
	resolveFrame,
	unionBox,
	viewFrame,
	visibleBox,
	type Box
} from '../src/lib/utils/groupCore';

const CW = 1920;
const CH = 1080;
const none = () => undefined;

describe('mapBox / compose', () => {
	it('the identity leaves a box exactly as authored', () => {
		const b = { x: 120, y: 240, width: 400, height: 160 };
		expect(mapBox(IDENTITY, b)).toEqual(b);
	});

	it('scales position and size, then shifts', () => {
		expect(mapBox({ s: 2, dx: 10, dy: -5 }, { x: 1, y: 2, width: 3, height: 4 })).toEqual({
			x: 12,
			y: -1,
			width: 6,
			height: 8
		});
	});

	it('compose applies the inner frame first, then the outer', () => {
		const outer = { s: 2, dx: 100, dy: 0 };
		const inner = { s: 3, dx: 10, dy: 20 };
		const b = { x: 1, y: 1, width: 1, height: 1 };
		expect(mapBox(compose(outer, inner), b)).toEqual(mapBox(outer, mapBox(inner, b)));
	});
});

describe('cameras', () => {
	it('viewFrame fits a rectangle of the canvas shape exactly', () => {
		const f = viewFrame({ x: 100, y: 50, width: 192, height: 108 }, CW, CH)!;
		expect(f.s).toBe(10);
		expect(mapBox(f, { x: 100, y: 50, width: 192, height: 108 })).toEqual({ x: 0, y: 0, width: CW, height: CH });
	});

	it('viewFrame keeps the aspect: a square is centred with side margins', () => {
		const f = viewFrame({ x: 0, y: 0, width: 100, height: 100 }, CW, CH)!;
		expect(f.s).toBeCloseTo(10.8);
		const m = mapBox(f, { x: 0, y: 0, width: 100, height: 100 });
		expect(m.height).toBeCloseTo(CH);
		expect(m.x + m.width / 2).toBeCloseTo(CW / 2);
	});

	it('viewFrame refuses an empty rectangle', () => {
		expect(viewFrame({ x: 0, y: 0, width: 0, height: 10 }, CW, CH)).toBeNull();
	});

	it("focusFrame puts the point at the canvas centre — the EP001 Templates shot", () => {
		// The Templates slide is Diagram ×21 about `stats` (739,329 104×71): this is
		// the frame the deck's hand-typed numbers were made with.
		const stats = { x: 739, y: 329, width: 104, height: 71 };
		const f = focusFrame([stats.x + stats.width / 2, stats.y + stats.height / 2], 21, CW, CH);
		const m = mapBox(f, stats);
		expect(m.x + m.width / 2).toBeCloseTo(CW / 2);
		expect(m.y + m.height / 2).toBeCloseTo(CH / 2);
		expect(m.width).toBe(2184);
		// And another part lands where the slide placed it by hand (booth: 1842,-3314).
		const booth = mapBox(f, { x: 833, y: 181, width: 463, height: 556 });
		expect(booth.x).toBe(1842);
		expect(booth.y).toBe(-3313.5); // the slide has it rounded to -3314
	});

	it('padBox grows a box by a fraction of its size on every side', () => {
		expect(padBox({ x: 100, y: 100, width: 100, height: 50 }, 0.1)).toEqual({ x: 90, y: 95, width: 120, height: 60 });
		expect(padBox({ x: 1, y: 2, width: 3, height: 4 }, -1)).toEqual({ x: 1, y: 2, width: 3, height: 4 });
	});

	it('visibleBox is the canvas seen in local units', () => {
		const f = { s: 2, dx: -100, dy: 50 };
		const v = visibleBox(f, CW, CH);
		expect(mapBox(f, v)).toEqual({ x: 0, y: 0, width: CW, height: CH });
	});

	it('unionBox spans every box, and is null for none', () => {
		const boxes: Box[] = [
			{ x: 0, y: 10, width: 10, height: 10 },
			{ x: 50, y: 0, width: 5, height: 5 }
		];
		expect(unionBox(boxes)).toEqual({ x: 0, y: 0, width: 55, height: 20 });
		expect(unionBox([])).toBeNull();
	});
});

describe('hide', () => {
	it('adds a group’s own names to everything its parent hides', () => {
		const s = childHide(childHide(NOTHING_HIDDEN, 'outer', ['logo']), 'inner', ['cloud']);
		expect(isHidden(s, 'logo')).toBe(true);
		expect(isHidden(s, 'cloud')).toBe(true);
		expect(isHidden(s, 'booth')).toBe(false);
	});

	it('hiding a nested group by its name hides every member of it', () => {
		const outer = childHide(NOTHING_HIDDEN, 'scene', ['booths']);
		const inner = childHide(outer, 'booths', []);
		expect(isHidden(inner, 'booth-b1')).toBe(true);
		expect(isHidden(childHide(outer, 'other', []), 'x')).toBe(false);
	});

	it('never hides an unnamed member by accident', () => {
		expect(isHidden(childHide(NOTHING_HIDDEN, '', ['']), '')).toBe(false);
	});
});

describe('morph names', () => {
	it('joins prefix and member name', () => {
		expect(morphName('cam', 'api')).toBe('cam-api');
		expect(morphName('ep1', 'booth-r1')).toBe('ep1-booth-r1');
	});

	it('gives no name to an unnamed member, no prefix, or an invalid identifier', () => {
		expect(morphName('cam', '')).toBeNull();
		expect(morphName(null, 'api')).toBeNull();
		expect(morphName('cam', 'two words')).toBeNull();
		expect(morphName('1x', 'api')).toBeNull();
	});

	it('writes one rule per member, unscoped by default', () => {
		expect(morphRules('cam', ['api', 'db', 'api'], null)).toBe(
			'[data-gp-morph="cam-api"] { view-transition-name: cam-api; }\n' +
				'[data-gp-morph="cam-db"] { view-transition-name: cam-db; }'
		);
	});

	it('scopes the rules to the given transition kinds', () => {
		expect(morphRules('cam', ['api'], ['morph', 'morph-slow'])).toBe(
			'html[data-vt-kind="morph"] [data-gp-morph="cam-api"], ' +
				'html[data-vt-kind="morph-slow"] [data-gp-morph="cam-api"] { view-transition-name: cam-api; }'
		);
	});

	it('drops a kind that could break out of its selector', () => {
		expect(morphRules('cam', ['api'], 'x"] * {')).toBe('[data-gp-morph="cam-api"] { view-transition-name: cam-api; }');
	});
});

describe('resolveFrame — precedence and fall-through', () => {
	const parts: Record<string, Box> = {
		stats: { x: 739, y: 329, width: 104, height: 71 },
		big: { x: 0, y: 0, width: 1920, height: 1080 }
	};
	const lookup = (n: string) => parts[n];

	it('no camera → the x/y/scale placement', () => {
		expect(resolveFrame({ x: 5, y: 6, scale: 0.5 }, none, CW, CH)).toEqual({
			frame: { s: 0.5, dx: 5, dy: 6 },
			source: 'place'
		});
	});

	it('defaults to the identity', () => {
		expect(resolveFrame({}, none, CW, CH).frame).toEqual(IDENTITY);
	});

	it('view beats fit beats focus beats placement', () => {
		const all = { x: 9, view: parts.big, fit: 'stats', focus: 'stats', zoom: 3 };
		expect(resolveFrame(all, lookup, CW, CH).source).toBe('view');
		expect(resolveFrame({ ...all, view: null }, lookup, CW, CH).source).toBe('fit');
		expect(resolveFrame({ ...all, view: null, fit: null }, lookup, CW, CH).source).toBe('focus');
	});

	it('an unknown name falls through instead of breaking the scene', () => {
		expect(resolveFrame({ fit: 'nope', focus: 'stats', zoom: 2 }, lookup, CW, CH).source).toBe('focus');
		expect(resolveFrame({ focus: 'nope', zoom: 2, x: 7 }, lookup, CW, CH)).toEqual({
			frame: { s: 1, dx: 7, dy: 0 },
			source: 'place'
		});
	});

	it('focus takes a literal point too', () => {
		const { frame, source } = resolveFrame({ focus: [960, 540], zoom: 2 }, none, CW, CH);
		expect(source).toBe('focus');
		expect(frame).toEqual({ s: 2, dx: -960, dy: -540 });
	});

	it('junk zoom and scale fall back to 1, junk offsets to 0', () => {
		expect(resolveFrame({ focus: [0, 0], zoom: 0 }, none, CW, CH).frame.s).toBe(1);
		expect(resolveFrame({ scale: -2, x: NaN }, none, CW, CH).frame).toEqual(IDENTITY);
	});
});
