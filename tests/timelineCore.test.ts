// timelineCore — the VOD recorder's text timeline (specs/VOD-RECORD-1.md).
//
// The timeline is the INTERFACE: a speaker edits it by hand and replays it. So the
// guarantees pinned here are the ones an edit leans on — what is written parses back to
// the same actions, a line that does not parse is reported (never skipped), `shift`
// moves only the lines after it, and paths name slides the way a human would.
import { describe, expect, it } from 'vitest';
import {
	appendEvent,
	bookClear,
	bookErase,
	bookPut,
	diffInk,
	formatAction,
	formatClock,
	formatTimeline,
	inkSnapshot,
	landingPath,
	letterbox,
	outputSizes,
	parseClock,
	parseTimeline,
	partialPoints,
	pickMime,
	recordingName,
	relativeHref,
	resolveHref,
	sameAspect,
	videoBitrate,
	type TimelineAction,
	type TimelineEvent
} from '$lib/record/timelineCore';
import type { InkBook, Stroke } from '$lib/annotate/annotateCore';

const DECK = '/slides/';
const pen = (id: string, extra: Partial<Stroke> = {}): Stroke => ({
	id,
	tool: 'pen',
	points: [
		[0, 0],
		[100, 0]
	],
	...extra
});

describe('clock', () => {
	it('formats minutes and hours', () => {
		expect(formatClock(0)).toBe('00:00.000');
		expect(formatClock(4.25)).toBe('00:04.250');
		expect(formatClock(62.5)).toBe('01:02.500');
		expect(formatClock(3725.001)).toBe('1:02:05.001');
		expect(formatClock(-3)).toBe('00:00.000');
		expect(formatClock(NaN)).toBe('00:00.000');
	});

	it('parses what it formats, and plain seconds', () => {
		for (const s of [0, 4.25, 62.5, 3725.001]) expect(parseClock(formatClock(s))).toBeCloseTo(s, 6);
		expect(parseClock('12.5')).toBe(12.5);
		expect(parseClock('1:5')).toBe(65);
	});

	it('refuses what is not a time', () => {
		for (const bad of ['', 'abc', '1:60', '-1', '1::2', '00:04.2.1']) expect(parseClock(bad)).toBeNull();
	});
});

describe('actions round-trip through text', () => {
	const actions: TimelineAction[] = [
		{ kind: 'goto', href: 'intro.html' },
		{ kind: 'goto', href: 'title.html', back: true, end: true },
		{ kind: 'goto', href: 'appendix.html?return=intro.html' },
		{ kind: 'goto', href: '/other/x.html' },
		{ kind: 'step' },
		{ kind: 'step', back: true },
		{ kind: 'continue' },
		{ kind: 'anim', playing: true, fraction: 0.25 },
		{ kind: 'anim', playing: false, fraction: 1 },
		{ kind: 'trigger', name: 'save-cursor' },
		{ kind: 'trigger', name: 'has space # hash' },
		{ kind: 'highlight', name: 'api' },
		{ kind: 'highlight', name: null },
		{ kind: 'highlight', name: 'off' },
		{ kind: 'ink', op: 'draw', slide: 'intro.html', dur: 0.84, stroke: pen('ink-1', { color: '#ff0' }) },
		{ kind: 'ink', op: 'draw', slide: 'intro.html', dur: 0, stroke: { id: 't1', tool: 'text', points: [[5, 6]], text: 'hi # there', size: 30 } },
		{ kind: 'ink', op: 'erase', slide: 'intro.html', ids: ['ink-1', 'ink-2'] },
		{ kind: 'ink', op: 'clear', slide: 'intro.html' },
		{ kind: 'ink', op: 'clear', slide: '*' },
		{ kind: 'end' }
	];

	it('every action survives format → parse unchanged', () => {
		const events: TimelineEvent[] = actions.map((a, i) => ({ ...a, t: i }) as TimelineEvent);
		const text = formatTimeline({ header: { deck: DECK }, events });
		const { timeline, errors } = parseTimeline(text);
		expect(errors).toEqual([]);
		expect(timeline.events).toEqual(events);
		expect(timeline.header.deck).toBe(DECK);
	});

	it('writes the lines a person can read', () => {
		expect(formatAction({ kind: 'goto', href: 'title.html', back: true, end: true })).toBe('goto title.html back end');
		expect(formatAction({ kind: 'anim', playing: true, fraction: 0.25 })).toBe('anim play 0.250');
		expect(formatAction({ kind: 'highlight', name: null })).toBe('highlight off');
		expect(formatAction({ kind: 'highlight', name: 'off' })).toBe('highlight "off"');
	});

	it('never writes a stroke`s drawing time into its JSON (the duration says it)', () => {
		const line = formatAction({ kind: 'ink', op: 'draw', slide: 'a.html', dur: 0.5, stroke: pen('x', { ms: 500 }) });
		expect(line).not.toContain('"ms"');
		expect(line).toContain('draw 0.5 {');
	});
});

describe('parseTimeline', () => {
	it('reads comments, blank lines and trailing comments', () => {
		const { timeline, errors } = parseTimeline(`# GeekPresent timeline v1
# deck: /slides/

00:01.000 goto intro.html   # the intro
  00:02 step
`);
		expect(errors).toEqual([]);
		expect(timeline.events.map((e) => [e.t, e.kind])).toEqual([
			[1, 'goto'],
			[2, 'step']
		]);
	});

	it('reports every bad line with its number, and keeps the good ones', () => {
		const { timeline, errors } = parseTimeline(`00:01 goto a.html
nonsense here
00:02 fly away
00:03 anim spin 0.5
00:04 ink a.html draw 1 {"id":"x","points":[]}
00:05 step`);
		expect(errors.map((e) => e.line)).toEqual([2, 3, 4, 5]);
		expect(errors[0].message).toMatch(/not a time/);
		expect(errors[1].message).toMatch(/unknown action "fly"/);
		expect(errors[3].message).toMatch(/no drawable points/);
		expect(timeline.events).toHaveLength(2);
	});

	it('shift moves only the lines after it, cumulatively', () => {
		const { timeline } = parseTimeline(`00:01 goto a.html
shift +2
00:03 step
shift -0.5
00:05 step`);
		expect(timeline.events.map((e) => e.t)).toEqual([1, 5, 6.5]);
	});

	it('sorts out-of-order lines, keeping equal times in written order', () => {
		const { timeline } = parseTimeline(`00:05 end
00:01 goto a.html
00:01 step`);
		expect(timeline.events.map((e) => e.kind)).toEqual(['goto', 'step', 'end']);
	});

	it('refuses an unterminated quote or brace', () => {
		expect(parseTimeline('00:01 trigger "open').errors).toHaveLength(1);
		expect(parseTimeline('00:01 ink a.html draw 1 {"id":"x"').errors).toHaveLength(1);
	});

	it('keeps a # inside an ink stroke`s JSON', () => {
		const { timeline, errors } = parseTimeline('00:01 ink a.html draw 0 {"id":"x","tool":"pen","points":[[1,2]],"color":"#ff0000"}');
		expect(errors).toEqual([]);
		expect((timeline.events[0] as { stroke: Stroke }).stroke.color).toBe('#ff0000');
	});

	it('sanitises an ink stroke like the ink book does (no CSS through the colour)', () => {
		const { timeline } = parseTimeline('00:01 ink a.html draw 0 {"id":"x","points":[[1,2]],"color":"red;}body{x"}');
		expect((timeline.events[0] as { stroke: Stroke }).stroke.color).toBeUndefined();
	});
});

describe('appendEvent', () => {
	it('collapses a scrub (anim lines closer than 40 ms) into its last state', () => {
		let ev: TimelineEvent[] = [];
		ev = appendEvent(ev, { kind: 'anim', playing: false, fraction: 0.1 }, 1);
		ev = appendEvent(ev, { kind: 'anim', playing: false, fraction: 0.2 }, 1.02);
		ev = appendEvent(ev, { kind: 'anim', playing: false, fraction: 0.3 }, 1.2);
		expect(ev.map((e) => [e.t, (e as { fraction: number }).fraction])).toEqual([
			[1, 0.2],
			[1.2, 0.3]
		]);
	});

	it('clamps a time before the start to 0', () => {
		expect(appendEvent([], { kind: 'step' }, -0.3)[0].t).toBe(0);
	});
});

describe('slide paths', () => {
	it('names a slide relative to its deck, dropping window flags', () => {
		expect(relativeHref('http://h/slides/intro.html?present', DECK)).toBe('intro.html');
		expect(relativeHref('./intro.html', DECK, 'http://h/slides/title.html')).toBe('intro.html');
		expect(relativeHref('./a.html?return=b.html', DECK, 'http://h/slides/b.html')).toBe('a.html?return=b.html');
		expect(relativeHref('/portrait/x.html', DECK, 'http://h/slides/b.html')).toBe('/portrait/x.html');
		expect(relativeHref('http://h/slides/intro.html/', DECK)).toBe('intro.html');
	});

	it('resolves back to the address the slides window navigates to', () => {
		expect(resolveHref('intro.html', DECK)).toBe('/slides/intro.html');
		expect(resolveHref('/portrait/x.html', DECK)).toBe('/portrait/x.html');
		expect(landingPath('a.html?return=b.html', DECK)).toBe('/slides/a.html');
	});
});

describe('diffInk', () => {
	const book = (entries: Record<string, Stroke[]>): InkBook =>
		Object.fromEntries(Object.entries(entries).map(([k, s]) => [k, { strokes: s, ts: 1 }]));

	it('a new stroke is a draw that began when the pen went down', () => {
		const [c] = diffInk({}, book({ '/slides/a.html': [pen('p', { ms: 800 })] }), DECK);
		expect(c.action).toMatchObject({ kind: 'ink', op: 'draw', slide: 'a.html', dur: 0.8 });
		expect((c.action as { stroke: Stroke }).stroke.ms).toBeUndefined();
		expect(c.lead).toBe(0.8);
	});

	it('a changed stroke is an instant draw; a removed one an erase; an emptied slide a clear', () => {
		const prev = book({ '/slides/a.html': [pen('p'), pen('q')], '/slides/b.html': [pen('r')] });
		const next = book({ '/slides/a.html': [pen('p', { color: '#fff' })] });
		const kinds = diffInk(prev, next, DECK).map((c) => formatAction(c.action).split(' {')[0]);
		expect(kinds).toEqual(['ink a.html erase q', 'ink a.html draw 0', 'ink b.html clear']);
	});

	it('RESET ALL on the deck is one ink * clear', () => {
		const prev = book({ '/slides/a.html': [pen('p')], '/slides/b.html': [pen('r')] });
		expect(diffInk(prev, {}, DECK).map((c) => formatAction(c.action))).toEqual(['ink * clear']);
	});

	it('ignores other decks', () => {
		expect(diffInk({}, book({ '/portrait/a.html': [pen('p')] }), DECK)).toEqual([]);
	});
});

describe('the ink book, as replay writes it', () => {
	it('puts, replaces, erases and clears', () => {
		let b: InkBook = {};
		b = bookPut(b, '/slides/a.html', pen('p'), 5);
		b = bookPut(b, '/slides/a.html', pen('p', { color: '#fff' }), 6);
		b = bookPut(b, '/slides/b.html', pen('q'), 6);
		b = bookPut(b, '/portrait/a.html', pen('z'), 6);
		expect(b['/slides/a.html'].strokes).toEqual([pen('p', { color: '#fff' })]);
		b = bookErase(b, '/slides/a.html', ['p'], 7);
		expect(b['/slides/a.html']).toBeUndefined();
		b = bookClear(b, null, DECK);
		expect(Object.keys(b)).toEqual(['/portrait/a.html']);
	});

	it('snapshots the deck`s ink as draws at 0', () => {
		const b: InkBook = { '/slides/a.html': { strokes: [pen('p', { ms: 300 })], ts: 1 }, '/x/y.html': { strokes: [pen('z')], ts: 1 } };
		expect(inkSnapshot(b, DECK)).toEqual([{ kind: 'ink', op: 'draw', slide: 'a.html', dur: 0, stroke: pen('p') }]);
	});
});

describe('partialPoints', () => {
	const line: [number, number][] = [
		[0, 0],
		[10, 0],
		[10, 10]
	];
	it('cuts a polyline by length, ending on an interpolated point', () => {
		expect(partialPoints(line, 0.25)).toEqual([
			[0, 0],
			[5, 0]
		]);
		expect(partialPoints(line, 0.75)).toEqual([
			[0, 0],
			[10, 0],
			[10, 5]
		]);
		expect(partialPoints(line, 1)).toEqual(line);
		expect(partialPoints(line, 0)).toEqual([[0, 0], [0, 0]]);
		expect(partialPoints([], 0.5)).toEqual([]);
	});
});

describe('video settings', () => {
	it('prefers MP4 (H.264) and falls back to WebM', () => {
		expect(pickMime((t) => t.startsWith('video/mp4'), true)).toBe('video/mp4;codecs=avc1.640028,mp4a.40.2');
		expect(pickMime((t) => t.startsWith('video/webm'), false)).toBe('video/webm;codecs=vp9');
		expect(pickMime(() => false, false)).toBe('');
		expect(
			pickMime(() => {
				throw new Error('x');
			}, false)
		).toBe('');
	});

	it('uses YouTube`s recommended bitrate', () => {
		expect(videoBitrate(1920, 1080, 30)).toBe(8_000_000);
		expect(videoBitrate(1920, 1080, 60)).toBe(12_000_000);
		expect(videoBitrate(1280, 720, 30)).toBeGreaterThanOrEqual(2_500_000);
	});

	it('offers sizes that keep the canvas shape, the canvas itself second', () => {
		expect(outputSizes(1920, 1080).map((s) => `${s.width}x${s.height}`)).toEqual(['1280x720', '1920x1080', '2560x1440', '3840x2160']);
		expect(outputSizes(1080, 1920)[1]).toMatchObject({ width: 1080, height: 1920 });
	});

	it('letterboxes a frame of another shape', () => {
		expect(letterbox(1920, 1080, 1920, 1080)).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
		expect(letterbox(1600, 1200, 1920, 1080)).toEqual({ x: 240, y: 0, width: 1440, height: 1080 });
		expect(sameAspect(1280, 720, 1920, 1080)).toBe(true);
		expect(sameAspect(1600, 1200, 1920, 1080)).toBe(false);
	});

	it('names a take after its deck and time', () => {
		expect(recordingName('/slides/', new Date(2026, 9, 22, 14, 5, 9))).toBe('slides-2026-10-22-140509');
	});
});
