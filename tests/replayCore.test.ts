// replayCore — the VOD replay scheduler, on a fake clock (specs/VOD-RECORD-1.md).
import { describe, expect, it } from 'vitest';
import { ReplayRunner, type InkOp } from '$lib/record/replayCore';
import { parseTimeline, type TimelineAction } from '$lib/record/timelineCore';

function setup(text: string) {
	const { timeline, errors } = parseTimeline(text);
	expect(errors).toEqual([]);
	const sent: string[] = [];
	const ink: InkOp[] = [];
	const warnings: string[] = [];
	const runner = new ReplayRunner(timeline.events, '/slides/', {
		send: (a: TimelineAction) => sent.push(a.kind === 'goto' ? `goto ${a.href}` : a.kind),
		ink: (op) => ink.push(op),
		warn: (m) => warnings.push(m)
	});
	return { runner, sent, ink, warnings };
}

describe('ReplayRunner', () => {
	it('primes the opening goto, then waits for the page before anything else', () => {
		const { runner, sent } = setup(`00:00 goto a.html
00:00 trigger t
00:01 step`);
		runner.prime(0);
		expect(sent).toEqual(['goto a.html']);
		expect(runner.waiting).toBe(true);
		runner.tick(0.5);
		expect(sent).toEqual(['goto a.html']); // still loading
		runner.here('/slides/a.html');
		runner.tick(0.6);
		expect(sent).toEqual(['goto a.html', 'trigger']);
		runner.tick(1);
		expect(sent).toEqual(['goto a.html', 'trigger', 'step']);
	});

	it('fires what fell due during a slow load at once, without shifting later lines', () => {
		const { runner, sent } = setup(`00:01 goto b.html
00:02 step
00:05 step back`);
		runner.tick(1);
		runner.tick(3); // b.html still loading: the 00:02 step waits
		expect(sent).toEqual(['goto b.html']);
		runner.here('/slides/b.html');
		runner.tick(3.1);
		expect(sent).toEqual(['goto b.html', 'step']);
		runner.tick(4.9);
		expect(sent).toHaveLength(2);
		runner.tick(5);
		expect(sent).toEqual(['goto b.html', 'step', 'step']);
	});

	it('ignores a here for another page, and gives up waiting after the limit', () => {
		const { runner, sent, warnings } = setup(`00:01 goto b.html
00:02 step`);
		runner.tick(1);
		runner.here('/slides/a.html');
		runner.tick(2);
		expect(sent).toEqual(['goto b.html']);
		runner.tick(9.5);
		expect(sent).toEqual(['goto b.html', 'step']);
		expect(warnings).toHaveLength(1);
	});

	it('redraws a stroke over its duration, then leaves it whole', () => {
		const { runner, ink } = setup('00:01 ink a.html draw 2 {"id":"s","tool":"pen","points":[[0,0],[100,0]]}');
		runner.tick(1);
		runner.tick(2);
		const last = ink[ink.length - 1] as { stroke: { points: number[][] } };
		expect(last.stroke.points).toEqual([
			[0, 0],
			[50, 0]
		]);
		runner.tick(3.5);
		expect((ink[ink.length - 1] as { stroke: { points: number[][] } }).stroke.points).toEqual([
			[0, 0],
			[100, 0]
		]);
		const writes = ink.length;
		runner.tick(4);
		expect(ink.length).toBe(writes); // finished — no more writes
		expect(runner.done).toBe(true);
	});

	it('stops at end, and reports its length', () => {
		const { runner, sent } = setup(`00:01 step
00:02 end
00:03 step`);
		expect(runner.duration).toBe(3);
		runner.tick(10);
		expect(sent).toEqual(['step']);
		expect(runner.done).toBe(true);
	});

	it('passes erase and clear straight to the ink book', () => {
		const { runner, ink } = setup(`00:01 ink a.html erase x y
00:01 ink * clear`);
		runner.tick(1);
		expect(ink).toEqual([
			{ op: 'erase', slide: 'a.html', ids: ['x', 'y'] },
			{ op: 'clear', slide: '*' }
		]);
	});
});
