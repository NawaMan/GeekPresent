// @vitest-environment node
//
// True server-side render of Cursor (svelte/server, no DOM). Built deck HTML
// never contains slide markup (SlideDeck gates it behind onMount), so this
// render IS the evidence that a Cursor's flight — base pose, generated
// @keyframes, ripple markup, and named-target resolution — comes out of
// props alone at prerender time, exactly like the rest of the Sprite family.
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { blockAnchors } from '../src/lib/stores/blockAnchors';
import DrawCursorHost from './DrawCursorHost.svelte';
import DrawCursorScriptHost from './DrawCursorScriptHost.svelte';
import DrawCursorTriggerHost from './DrawCursorTriggerHost.svelte';

// Module state with no onDestroy on the server — reset per test (Connector's
// SSR precedent) so each one states its own preconditions.
beforeEach(() => blockAnchors.set(new Map()));

describe('Cursor (SSR)', () => {
	it('prerenders the flight: base pose, generated keyframes, no NaN', () => {
		const { body } = render(DrawCursorHost, { props: {} });
		expect(body).toContain('@keyframes draw-sprite-');
		expect(body).toContain('left:80px; top:80px;'); // base: literal [100,100] − 20
		expect(body).toContain('100% { left:580px; top:330px;'); // target centre − 20
		expect(body).not.toContain('NaN');
		// A locked Sprite ships zero ADJUST chrome — ever, on the server.
		expect(body).not.toContain('draw-handle');
		expect(body).not.toContain('sprite-hit');
	});

	it('prerenders the click ripple at the target, timed to its arrival', () => {
		const { body } = render(DrawCursorHost, { props: {} });
		expect(body).toContain('class="cursor-ripple');
		expect(body).toContain('cx="600"');
		expect(body).toContain('cy="350"');
		expect(body).toContain('animation-delay:1.7s');
	});

	it('a single-waypoint path prerenders a static, non-animating cursor', () => {
		const { body } = render(DrawCursorHost, { props: { legs: 'one' } });
		expect(body).not.toContain('@keyframes draw-sprite-');
		expect(body).toContain('left:580px; top:330px;');
		expect(body).toContain('animation-delay:0.2s');
	});

	it('renders nothing when the named target is unresolved — never a stranded glyph', () => {
		const { body } = render(DrawCursorHost, { props: { showTarget: false } });
		expect(body).not.toContain('draw-cursor');
		expect(body).not.toContain('cursor-ripple');
		expect(body).not.toContain('sprite-el');
	});

	it('is aria-hidden and pointer-inert, like the rest of the visual-aid family', () => {
		const { body } = render(DrawCursorHost, { props: {} });
		expect(body).toContain('aria-hidden="true"');
		expect(body).toContain('pointer-events:none');
	});
});

describe('Cursor script mode (SSR)', () => {
	it('prerenders the compiled chain: base pose, keyframes, ripple, no NaN', () => {
		const { body } = render(DrawCursorScriptHost, { props: {} });
		expect(body).toContain('@keyframes draw-sprite-');
		expect(body).toContain('left:680px; top:230px;'); // warpTo [700,250] − 20
		expect(body).toContain('100% { left:680px; top:280px;'); // orbit closes at entry angle
		expect(body).toContain('class="cursor-ripple');
		expect(body).toContain('cx="700"');
		expect(body).toContain('cy="300"');
		expect(body).not.toContain('NaN');
	});

	it('renders nothing when the named orbit centre is unresolved', () => {
		const { body } = render(DrawCursorScriptHost, { props: { showDial: false } });
		expect(body).not.toContain('draw-cursor');
		expect(body).not.toContain('sprite-el');
	});
});

describe('Cursor startOn (SSR)', () => {
	it('prerenders idle and paused — no autoplay leaks into the built page', () => {
		const { body } = render(DrawCursorTriggerHost, { props: {} });
		expect(body).toContain('left:80px; top:80px;'); // base pose only
		expect(body).toContain('animation-play-state:paused;');
		// The ripple is not even mounted while idle (see Cursor.svelte's idle
		// branch) — a delay ticking from a mount nobody has "started" yet
		// would fire out of sync with the frozen flight.
		expect(body).not.toContain('cursor-ripple');
	});
});
