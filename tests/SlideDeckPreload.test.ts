// Preloading the neighbouring slides (preloadNeighbours, utils/preloadCore).
//
// Two guarantees. A shown slide names its neighbours in a speculation-rules script, so
// Chrome can load them ahead of the page turn. And a slide Chrome loaded that way stays
// SILENT until it is shown: it must not announce itself to the console, tell a Recorder it
// arrived, or mount its slide — otherwise a page nobody has turned to would drive the
// windows that are on screen.
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import SlideDeck from '$lib/components/SlideDeck.svelte';
import { setPageUrl, resetPageUrl } from './stubs/app-stores';
import type { RecorderMessage } from '$lib/record/recordBus';

const pages = [
	{ path: 'one.html', title: 'One' },
	{ path: 'two.html', title: 'Two' },
	{ path: 'three.html', title: 'Three' }
];
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const doc = document as Document & { prerendering?: boolean };
const rules = () => document.getElementById('gp-preload');

async function mount(path: string, props: Record<string, unknown> = {}) {
	setPageUrl(path);
	history.replaceState(null, '', path);
	const r = render(SlideDeck, { props: { pages, ...props } });
	await tick();
	await tick();
	await wait();
	return r;
}

let heard: RecorderMessage[] = [];
let recorder: BroadcastChannel;

beforeAll(() => {
	const s = HTMLScriptElement as unknown as { supports?: (t: string) => boolean };
	if (!s.supports) s.supports = (t) => t === 'speculationrules';
	// The console's animation panel asks for the slide's animations; jsdom has none.
	const none = () => [] as Animation[];
	(Element.prototype as unknown as { getAnimations: () => Animation[] }).getAnimations = none;
	(Document.prototype as unknown as { getAnimations: () => Animation[] }).getAnimations = none;
	if (!('ResizeObserver' in globalThis)) {
		(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
});
beforeEach(() => {
	// The previous test's deck can still announce its slide while it is torn down.
	localStorage.clear();
	heard = [];
	recorder = new BroadcastChannel('geekpresent:recorder');
	recorder.onmessage = (e) => heard.push(e.data);
});
afterEach(() => {
	recorder.close();
	delete doc.prerendering;
	rules()?.remove();
	resetPageUrl();
	localStorage.clear();
});

describe('preloading the neighbours', () => {
	it('names the next and the previous slide', async () => {
		await mount('/slides/two.html');
		expect(JSON.parse(rules()?.textContent ?? '{}')).toEqual({
			prerender: [{ source: 'list', urls: ['./three.html', './one.html'], eagerness: 'immediate' }]
		});
	});

	it('the console preloads its own ?present pages', async () => {
		await mount('/slides/one.html?present');
		expect(JSON.parse(rules()?.textContent ?? '{}').prerender[0].urls).toEqual(['./two.html?present']);
	});

	it('preloadNeighbours={false} asks for nothing', async () => {
		await mount('/slides/two.html', { preloadNeighbours: false });
		expect(rules()).toBeNull();
	});

	it('a preloaded slide stays silent until it is shown', async () => {
		Object.defineProperty(doc, 'prerendering', { value: true, configurable: true });
		const { container } = await mount('/slides/two.html');
		expect(localStorage.getItem('geekpresent:current:/slides/')).toBeNull();
		expect(heard.filter((m) => m.type === 'here')).toEqual([]);
		expect(container.querySelector('.content.ready')).toBeNull();
		expect(rules()).toBeNull();

		Object.defineProperty(doc, 'prerendering', { value: false, configurable: true });
		document.dispatchEvent(new Event('prerenderingchange'));
		await tick();
		await wait();
		expect(localStorage.getItem('geekpresent:current:/slides/')).toContain('two.html');
		expect(heard.some((m) => m.type === 'here')).toBe(true);
		expect(container.querySelector('.content.ready')).not.toBeNull();
		expect(rules()).not.toBeNull();
	});
});
