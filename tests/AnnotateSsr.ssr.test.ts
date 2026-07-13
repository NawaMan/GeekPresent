// @vitest-environment node
//
// True server-side render of Annotate (svelte/server, no DOM). The load-bearing claim is
// that it is SSR-INERT: a prerendered slide must ship no ink, no pointer surface, no
// toolbar and no chrome.
//
// This got MORE interesting, not less, when ink started persisting. It used to be inert
// because the store began empty and nothing could fill it. Now the store is backed by
// localStorage — so the guarantee rests entirely on `persisted()` degrading to a plain
// in-memory writable on the server (no window, no storage, no listener). If that contract
// ever broke, a prerendered page would ship whatever the person who ran the BUILD happened
// to have scribbled in their browser, to every visitor. This is the test that would catch it.
import { render } from 'svelte/server';
import { afterEach, describe, expect, it } from 'vitest';
import Annotate from '../src/lib/components/Annotate.svelte';
import { annotationMode, canAnnotate, inkBook, inkPath, resetAllInk } from '../src/lib/stores/annotation';

const SLIDE = '/slides/intro.html';

// Module state, and there is no onDestroy on the server, so it survives between renders.
afterEach(() => {
	resetAllInk();
	inkPath.set('');
	annotationMode.set(false);
	canAnnotate.set(false);
});

describe('Annotate (SSR)', () => {
	it('prerenders NOTHING — no surface, no ink, no toolbar, no toggle', () => {
		const { body } = render(Annotate, { props: {} });
		expect(body).not.toContain('annot-surface');
		expect(body).not.toContain('annot-stroke');
		expect(body).not.toContain('annot-bar');
		expect(body).not.toContain('annot-toggle');
		expect(body).not.toContain('<path');
	});

	it('starts from an EMPTY book on the server, whatever a browser may hold', () => {
		// The persisted-ink contract, stated as a test: on the server this store is an
		// ordinary writable holding {} — it never reads localStorage, because there isn't one.
		expect(inkBook).toBeTruthy();
		const { body } = render(Annotate, { props: {} });
		expect(body).not.toContain('annot-stroke');
	});

	it('ships no pointer surface even if the mode were somehow on at prerender', () => {
		annotationMode.set(true);
		const { body } = render(Annotate, { props: {} });
		expect(body).not.toContain('annot-surface');
		expect(body).not.toContain('annot-bar');
	});

	it('never prerenders the stale-ink prompt, even for ink that IS stale', () => {
		// The prompt is browser-gated: a prerendered page is served to everyone, so telling a
		// stranger about "your annotations from 3 days ago" would be nonsense.
		canAnnotate.set(true);
		inkPath.set(SLIDE);
		inkBook.set({ [SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [9, 9]] }], ts: 1 } });
		const { body } = render(Annotate, { props: {} });
		expect(body).not.toContain('annot-stale');
		expect(body).not.toContain('RESET SLIDE');
	});

	it('renders the surface only once there IS ink — the client-side mirror path', () => {
		// The other half of the contract: inert, not broken. Give it a stroke (which only ever
		// happens in the browser) and it draws through drawCore's smoothing, at canvas scale,
		// pointer-transparent because the pen is down.
		inkPath.set(SLIDE);
		inkBook.set({
			[SLIDE]: { strokes: [{ id: 'a', tool: 'pen', points: [[0, 0], [100, 100], [200, 0]] }], ts: 1 }
		});
		const { body } = render(Annotate, { props: {} });

		expect(body).toContain('annot-surface');
		expect(body).toContain('viewBox="0 0 1920 1080"');
		expect(body).toContain('pointer-events:none');
		expect(body).toContain('M 0 0');
		expect(body).toContain('C '); // smoothPath's cubics, same as Polyline
		expect(body).not.toContain('annot-bar'); // the pen is not armed; nothing to put down
	});

	it('never emits NaN geometry from a junk stroke', () => {
		inkPath.set(SLIDE);
		inkBook.set({
			[SLIDE]: { strokes: [{ id: 'x', tool: 'highlighter', points: [[NaN, 0], [Infinity, 10]] }], ts: 1 }
		});
		const { body } = render(Annotate, { props: {} });
		expect(body).not.toContain('NaN');
	});
});
