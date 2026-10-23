// The VOD Recorder's wiring in SlideDeck (specs/VOD-RECORD-1.md): the slides window
// says `here`, obeys replayed commands through the same functions the live actions use,
// reports what it does only while recording, and — while replaying — ignores the
// console, so nothing but the timeline can move the deck mid-take.
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Host from './SlideDeckRelayHost.svelte';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';
import { gotoCalls, resetGoto } from './stubs/app-navigation';
import { activeSteps } from '$lib/stores/activeSteps';
import { lastTrigger } from '$lib/stores/triggers';
import type { RecorderMessage } from '$lib/record/recordBus';

const pages = [
	{ path: 'one.html', title: 'One' },
	{ path: 'two.html', title: 'Two' }
];
const DECK = '/slides/';
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

let recorder: BroadcastChannel;
let heard: RecorderMessage[] = [];

function storeState(state: string) {
	localStorage.setItem(`geekpresent:recorder:${DECK}`, JSON.stringify({ state, ts: Date.now() }));
}

async function mount(query = '') {
	setPageUrl(`/slides/one.html${query}`);
	// navigate() names a page turn against the real address bar, so put jsdom there too.
	history.replaceState(null, '', `/slides/one.html${query}`);
	const r = render(Host, { props: { pages } });
	await tick();
	await tick();
	await wait();
	return r;
}

function send(msg: RecorderMessage) {
	recorder.postMessage(msg);
}

beforeAll(() => {
	if (!('ResizeObserver' in globalThis)) {
		(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
	const none = () => [] as Animation[];
	(Element.prototype as unknown as { getAnimations: () => Animation[] }).getAnimations = none;
	(Document.prototype as unknown as { getAnimations: () => Animation[] }).getAnimations = none;
});

beforeEach(() => {
	resetGoto();
	heard = [];
	recorder = new BroadcastChannel('geekpresent:recorder');
	recorder.onmessage = (e) => heard.push(e.data);
});
afterEach(() => {
	recorder.close();
	resetPageUrl();
	localStorage.clear();
	activeSteps.set(null);
});

describe('the slides window and the Recorder', () => {
	it('says here on load, and again when asked', async () => {
		await mount();
		const here = heard.filter((m) => m.type === 'here');
		expect(here.length).toBeGreaterThanOrEqual(1);
		expect(here[0]).toMatchObject({ deck: DECK, here: { path: '/slides/one.html', width: 1920, height: 1080 } });
		heard = [];
		send({ type: 'hello', deck: DECK });
		await wait();
		expect(heard.some((m) => m.type === 'here')).toBe(true);
	});

	it('a ?present console never answers', async () => {
		await mount('?present');
		send({ type: 'hello', deck: DECK });
		await wait();
		expect(heard.filter((m) => m.type === 'here')).toEqual([]);
	});

	it('replays a goto, a step and a trigger through the live code paths', async () => {
		storeState('replaying');
		await mount();
		const next = vi.fn();
		const prev = vi.fn();
		activeSteps.set({ owner: {}, hasNext: true, hasPrev: true, next, prev });

		send({ type: 'cmd', deck: DECK, action: { kind: 'step' } });
		send({ type: 'cmd', deck: DECK, action: { kind: 'step', back: true } });
		send({ type: 'cmd', deck: DECK, action: { kind: 'trigger', name: 'go' } });
		send({ type: 'cmd', deck: DECK, action: { kind: 'goto', href: 'two.html' } });
		await wait();

		expect(next).toHaveBeenCalledTimes(1);
		expect(prev).toHaveBeenCalledTimes(1);
		let trig: string | undefined;
		lastTrigger.subscribe((v) => (trig = v?.name))();
		expect(trig).toBe('go');
		expect(gotoCalls).toEqual(['/slides/two.html']);
	});

	it('obeys no command while the Recorder is idle', async () => {
		await mount();
		send({ type: 'cmd', deck: DECK, action: { kind: 'goto', href: 'two.html' } });
		await wait();
		expect(gotoCalls).toEqual([]);
	});

	it('while replaying, the console cannot page the deck', async () => {
		storeState('replaying');
		await mount();
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: `geekpresent:current:${DECK}`,
				newValue: JSON.stringify({ path: 'two.html', ts: 1, role: 'present' })
			})
		);
		await tick();
		expect(gotoCalls).toEqual([]);
	});

	it('while recording, a page turn the console drives is reported as a goto', async () => {
		storeState('recording');
		await mount();
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: `geekpresent:current:${DECK}`,
				newValue: JSON.stringify({ path: 'two.html', ts: 1, role: 'present' })
			})
		);
		await wait();
		expect(gotoCalls).toEqual(['./two.html']);
		const actions = heard.filter((m) => m.type === 'action').map((m) => (m as { action: unknown }).action);
		expect(actions).toEqual([{ kind: 'goto', href: 'two.html' }]);
	});
});
