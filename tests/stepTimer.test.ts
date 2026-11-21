import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countdownLeft, createStepTimer, type StepCountdown } from '../src/lib/auto/stepTimer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup() {
	const seen: (StepCountdown | null)[] = [];
	const fire = vi.fn();
	const timer = createStepTimer((c) => seen.push(c));
	const last = () => seen[seen.length - 1];
	return { timer, fire, seen, last };
}

describe('createStepTimer', () => {
	it('takes the step when the wait runs out, and not before', () => {
		const { timer, fire, last } = setup();
		timer.set({ armed: true, waitMs: 5000, key: 0, fire });
		expect(last()).toMatchObject({ totalMs: 5000, leftMs: 5000, running: true });
		vi.advanceTimersByTime(4999);
		expect(fire).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fire).toHaveBeenCalledTimes(1);
		expect(last()).toBeNull();
	});

	it('does not start again by itself after it fired', () => {
		const { timer, fire } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		vi.advanceTimersByTime(60_000);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('is dropped when disarmed (a Space, a step still playing, a hold)', () => {
		const { timer, fire, last } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		vi.advanceTimersByTime(500);
		timer.set({ armed: false, waitMs: 1000, key: 0, fire });
		expect(last()).toBeNull();
		vi.advanceTimersByTime(5000);
		expect(fire).not.toHaveBeenCalled();
	});

	it('keeps counting when told the same thing again', () => {
		const { timer, fire, seen } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		vi.advanceTimersByTime(600);
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		expect(seen).toHaveLength(1);
		vi.advanceTimersByTime(400);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('starts the wait afresh at a new stop', () => {
		const { timer, fire, last } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		const first = last()!.seq;
		vi.advanceTimersByTime(900);
		timer.set({ armed: true, waitMs: 1000, key: 1, fire });
		expect(last()!.seq).not.toBe(first);
		vi.advanceTimersByTime(900);
		expect(fire).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('freezes with the time left, and goes on from there', () => {
		const { timer, fire, last } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		vi.advanceTimersByTime(700);
		timer.set({ armed: true, waitMs: 1000, key: 0, frozen: true, fire });
		expect(last()).toMatchObject({ leftMs: 300, running: false });
		vi.advanceTimersByTime(10_000);
		expect(fire).not.toHaveBeenCalled();
		timer.set({ armed: true, waitMs: 1000, key: 0, frozen: false, fire });
		expect(last()).toMatchObject({ leftMs: 300, running: true });
		vi.advanceTimersByTime(299);
		expect(fire).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fire).toHaveBeenCalledTimes(1);
	});

	it('can start frozen', () => {
		const { timer, fire, last } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, frozen: true, fire });
		expect(last()).toMatchObject({ leftMs: 1000, running: false });
		vi.advanceTimersByTime(5000);
		expect(fire).not.toHaveBeenCalled();
	});

	it('never arms on a wait that is not one', () => {
		const { timer, fire, seen } = setup();
		for (const waitMs of [0, -1, NaN, Infinity]) timer.set({ armed: true, waitMs, key: 0, fire });
		vi.advanceTimersByTime(60_000);
		expect(fire).not.toHaveBeenCalled();
		expect(seen).toHaveLength(0);
	});

	it('stop() drops it', () => {
		const { timer, fire } = setup();
		timer.set({ armed: true, waitMs: 1000, key: 0, fire });
		timer.stop();
		vi.advanceTimersByTime(5000);
		expect(fire).not.toHaveBeenCalled();
	});
});

describe('countdownLeft', () => {
	const c: StepCountdown = { totalMs: 5000, leftMs: 3000, running: true, at: 1000, seq: 1 };
	it('runs down from the snapshot while running, holds while frozen', () => {
		expect(countdownLeft(c, 1000)).toBe(3000);
		expect(countdownLeft(c, 2500)).toBe(1500);
		expect(countdownLeft(c, 99_000)).toBe(0);
		expect(countdownLeft({ ...c, running: false }, 99_000)).toBe(3000);
		expect(countdownLeft(null, 0)).toBe(0);
	});
});
