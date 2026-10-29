import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LivePointer from '../src/lib/components/LivePointer.svelte';
import {
	applyPointerParam,
	livePointer,
	setLivePointerDeck,
	setPointerChoice,
	togglePointer
} from '../src/lib/stores/livePointer';

// The live pointer draws a glyph where the mouse is, so a screen recorder that leaves the
// OS cursor out still records one. jsdom has no PointerEvent constructor; a MouseEvent of
// the same type carries the clientX/Y the component reads.
const move = (x: number, y: number) =>
	window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }));
const press = (x: number, y: number) =>
	window.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y }));
const glyph = (root: ParentNode) => root.querySelector<HTMLElement>('.live-glyph');
const url = (search: string) => new URL(`http://localhost/slides/title.html${search}`);
const hidesCursor = () => document.documentElement.classList.contains('gp-live-pointer');

beforeEach(() => {
	localStorage.clear();
	setLivePointerDeck(false);
	setPointerChoice(false);
	localStorage.clear();
});
afterEach(() => {
	vi.useRealTimers();
	setPointerChoice(false);
});

describe('livePointer store', () => {
	it('lets the speaker outrank the deck prop either way', () => {
		// (The deck-only case is resolveLivePointer's, in livePointerCore.test.ts.)
		setLivePointerDeck(true);
		setPointerChoice(false);
		expect(get(livePointer)).toBe(false);
		setPointerChoice(true);
		setLivePointerDeck(false);
		expect(get(livePointer)).toBe(true);
	});

	it('remembers ?pointer across a slide with no flag', () => {
		applyPointerParam(url('?pointer'));
		expect(get(livePointer)).toBe(true);
		applyPointerParam(url(''));
		expect(get(livePointer)).toBe(true);
		expect(localStorage.getItem('livePointer')).toBe('true');
		applyPointerParam(url('?pointer=off'));
		expect(get(livePointer)).toBe(false);
	});

	it('toggles', () => {
		togglePointer();
		expect(get(livePointer)).toBe(true);
		togglePointer();
		expect(get(livePointer)).toBe(false);
	});
});

describe('LivePointer', () => {
	it('draws nothing and leaves the real cursor alone while off', async () => {
		const { container } = render(LivePointer);
		move(100, 100);
		await tick();
		expect(container.querySelector('.live-pointer')).toBeNull();
		expect(hidesCursor()).toBe(false);
	});

	it('hides the real cursor and follows the mouse while on', async () => {
		setPointerChoice(true);
		const { container } = render(LivePointer, { props: { size: 24 } });
		await tick();
		expect(hidesCursor()).toBe(true);
		// Nothing drawn until the mouse has moved: there is no position to draw at.
		expect(glyph(container)).toBeNull();

		move(100, 50);
		await tick();
		// The arrow's tip (3,3 of 24) lands on the mouse.
		expect(glyph(container)?.style.transform).toContain('translate3d(97px, 47px, 0');
		expect(container.querySelector('.live-pointer')?.classList.contains('no-print')).toBe(true);

		move(300, 200);
		await tick();
		expect(glyph(container)?.style.transform).toContain('translate3d(297px, 197px, 0');
	});

	it('centres a dot on the mouse', async () => {
		setPointerChoice(true);
		const { container } = render(LivePointer, { props: { shape: 'dot', size: 20 } });
		move(100, 100);
		await tick();
		expect(glyph(container)?.style.transform).toContain('translate3d(90px, 90px, 0');
		expect(glyph(container)?.querySelector('circle')).not.toBeNull();
	});

	it('hides the glyph when the mouse leaves the window', async () => {
		setPointerChoice(true);
		const { container } = render(LivePointer);
		move(10, 10);
		await tick();
		expect(glyph(container)).not.toBeNull();
		document.documentElement.dispatchEvent(new MouseEvent('mouseleave'));
		await tick();
		expect(glyph(container)).toBeNull();
	});

	it('flashes a ripple on a press, then clears it', async () => {
		vi.useFakeTimers();
		setPointerChoice(true);
		const { container } = render(LivePointer);
		press(40, 60);
		await tick();
		const ripple = container.querySelector<HTMLElement>('.live-ripple');
		expect(ripple?.style.left).toBe('40px');
		expect(ripple?.style.top).toBe('60px');
		vi.advanceTimersByTime(700);
		await tick();
		expect(container.querySelector('.live-ripple')).toBeNull();
	});

	it('gives the real cursor back when switched off, and on unmount', async () => {
		setPointerChoice(true);
		const { container, unmount } = render(LivePointer);
		move(10, 10);
		await tick();
		setPointerChoice(false);
		await tick();
		expect(hidesCursor()).toBe(false);
		expect(container.querySelector('.live-pointer')).toBeNull();

		setPointerChoice(true);
		await tick();
		expect(hidesCursor()).toBe(true);
		unmount();
		expect(hidesCursor()).toBe(false);
	});
});
