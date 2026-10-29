import { describe, expect, it } from 'vitest';
import {
	STEP_DOTS_MAX,
	STEP_DOTS_POSITIONS,
	stepDotsAnchorStyle,
	stepDotsLabel,
	stepDotsPlacement,
	stepDotsView
} from '../src/lib/utils/stepDotsCore';

describe('stepDotsView', () => {
	it('draws nothing without a usable total', () => {
		expect(stepDotsView(0, undefined).kind).toBe('none');
		expect(stepDotsView(0, 0).kind).toBe('none');
		expect(stepDotsView(0, -3).kind).toBe('none');
		expect(stepDotsView(0, NaN).kind).toBe('none');
	});

	it('before the first step every dot is still to come', () => {
		const v = stepDotsView(0, 3);
		expect(v).toMatchObject({ kind: 'dots', dots: ['todo', 'todo', 'todo'], spent: false });
	});

	it('marks the step just taken as current and the earlier ones done', () => {
		expect(stepDotsView(2, 4)).toMatchObject({
			dots: ['done', 'current', 'todo', 'todo'],
			spent: false
		});
	});

	it('is spent once every step is taken', () => {
		expect(stepDotsView(3, 3)).toMatchObject({ dots: ['done', 'done', 'current'], spent: true });
	});

	it('clamps junk indices rather than throwing', () => {
		expect(stepDotsView(-2, 3)).toMatchObject({ index: 0 });
		expect(stepDotsView(9, 3)).toMatchObject({ index: 3, spent: true });
		expect(stepDotsView(NaN, 3)).toMatchObject({ index: 0 });
		expect(stepDotsView(undefined, 3)).toMatchObject({ index: 0 });
		expect(stepDotsView(1.7, 3)).toMatchObject({ index: 1 });
	});

	it('turns into a bar above the dot limit', () => {
		expect(stepDotsView(0, STEP_DOTS_MAX).kind).toBe('dots');
		const v = stepDotsView(5, 20);
		expect(v).toMatchObject({ kind: 'bar', fraction: 0.25, index: 5, total: 20, spent: false });
		expect(stepDotsView(20, 20)).toMatchObject({ kind: 'bar', fraction: 1, spent: true });
	});

	it('names the step for assistive tech', () => {
		expect(stepDotsLabel(stepDotsView(2, 5))).toBe('Step 2 of 5');
		expect(stepDotsLabel(stepDotsView(0, 0))).toBe('');
	});
});

describe('stepDotsPlacement', () => {
	it('maps every edge and corner to its anchor', () => {
		const got = Object.fromEntries(
			STEP_DOTS_POSITIONS.map((p) => {
				const { x, y, vertical } = stepDotsPlacement(p);
				return [p, `${x}/${y}${vertical ? '/v' : ''}`];
			})
		);
		expect(got).toEqual({
			top: 'center/start',
			bottom: 'center/end',
			left: 'start/center/v',
			right: 'end/center/v',
			'top-left': 'start/start',
			'top-right': 'end/start',
			'bottom-left': 'start/end',
			'bottom-right': 'end/end'
		});
	});

	it('falls back to bottom for an unknown position', () => {
		expect(stepDotsPlacement('middle').position).toBe('bottom');
		expect(stepDotsPlacement(undefined).position).toBe('bottom');
	});
});

describe('stepDotsAnchorStyle', () => {
	it('anchors from left/top only, pulling a far-edge row back inside', () => {
		expect(stepDotsAnchorStyle(stepDotsPlacement('bottom-right'), 1920, 1080, '36px')).toBe(
			'left: calc(1920px - 36px); top: calc(1080px - 36px); transform: translate(-100%, -100%);'
		);
		expect(stepDotsAnchorStyle(stepDotsPlacement('left'), 1920, 1080, '36px')).toBe(
			'left: 36px; top: 540px; transform: translate(0, -50%);'
		);
		expect(stepDotsAnchorStyle(stepDotsPlacement('top'), 1080, 1920, '36px')).toBe(
			'left: 540px; top: 36px; transform: translate(-50%, 0);'
		);
	});
});
