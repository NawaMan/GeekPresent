// recordBus — the wire between a deck's slides window and the VOD Recorder.
//
// The guarantee that matters most is the one that keeps every OTHER session quiet:
// the hooks call reportAction unconditionally, so it must be a no-op unless this window
// is the deck's slides window AND a recording is running right now.
import { afterEach, describe, expect, it } from 'vitest';
import {
	isRecorderMessage,
	listen,
	readStoredState,
	recorderState,
	reportAction,
	reportGoto,
	reportLeaving,
	setReportingDeck,
	STATUS_TTL_MS,
	type RecorderMessage
} from '$lib/record/recordBus';

const tick = () => new Promise((r) => setTimeout(r, 20));

afterEach(() => {
	setReportingDeck(null);
	recorderState.set('idle');
});

describe('readStoredState', () => {
	it('reads a fresh state, and a stale or junk one as idle', () => {
		const now = 100_000;
		expect(readStoredState(JSON.stringify({ state: 'recording', ts: now - 1000 }), now)).toBe('recording');
		expect(readStoredState(JSON.stringify({ state: 'recording', ts: now - STATUS_TTL_MS - 1 }), now)).toBe('idle');
		expect(readStoredState(JSON.stringify({ state: 'dancing', ts: now }), now)).toBe('idle');
		expect(readStoredState('{', now)).toBe('idle');
		expect(readStoredState(null, now)).toBe('idle');
	});
});

describe('isRecorderMessage', () => {
	it('accepts only our message types, for our deck', () => {
		expect(isRecorderMessage({ type: 'hello', deck: '/slides/' }, '/slides/')).toBe(true);
		expect(isRecorderMessage({ type: 'hello', deck: '/portrait/' }, '/slides/')).toBe(false);
		expect(isRecorderMessage({ type: 'boom', deck: '/slides/' }, '/slides/')).toBe(false);
		expect(isRecorderMessage(null, '/slides/')).toBe(false);
	});
});

describe('reportAction', () => {
	it('says leaving during a take (and while arming), never when idle', async () => {
		const heard: RecorderMessage[] = [];
		const other = new BroadcastChannel('geekpresent:recorder');
		other.onmessage = (e) => heard.push(e.data);
		setReportingDeck('/slides/');
		reportLeaving(); // idle
		for (const s of ['armed', 'recording', 'replaying'] as const) {
			recorderState.set(s);
			reportLeaving();
		}
		await tick();
		expect(heard.filter((m) => m.type === 'leaving')).toHaveLength(3);
		other.close();
	});

	it('reports only from the slides window of a deck being recorded', async () => {
		const heard: RecorderMessage[] = [];
		const stop = listen('/slides/', (m) => heard.push(m));
		// A BroadcastChannel never delivers to the very object that posted, but `listen`
		// and `post` share one per window — so listen through a second channel instead.
		const other = new BroadcastChannel('geekpresent:recorder');
		other.onmessage = (e) => heard.push(e.data);

		reportAction({ kind: 'step' }); // not a slides window
		setReportingDeck('/slides/');
		reportAction({ kind: 'step' }); // not recording
		recorderState.set('replaying');
		reportAction({ kind: 'step' }); // replaying is not recording
		recorderState.set('recording');
		reportAction({ kind: 'step', back: true });
		reportGoto('http://localhost/slides/intro.html?present', true, true);
		await tick();

		expect(heard.filter((m) => m.type === 'action').map((m) => (m as { action: unknown }).action)).toEqual([
			{ kind: 'step', back: true },
			{ kind: 'goto', href: 'intro.html', back: true, end: true }
		]);
		stop();
		other.close();
	});
});
