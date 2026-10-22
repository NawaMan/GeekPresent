// DOM tests for the ControlBar — the bottom-centre companion to the tool bar. It is a SHELL:
// SlideDeck fills it with the Table of Contents and the deck's ONE pager (here, stand-ins).
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import ControlBarHost from './ControlBarHost.svelte';
import { controlBarPinned, toolBarPinned } from '../src/lib/stores/chromePin';
import { setChromeBareDeck } from '../src/lib/stores/chromeBare';
import { consoleLive } from '../src/lib/stores/presenter';
import { tick } from 'svelte';
import { armChrome, disarmChrome } from '../src/lib/stores/chromeArm';

beforeEach(() => {
	localStorage.clear();
	controlBarPinned.set(false);
	toolBarPinned.set(false);
});

afterEach(() => {
	cleanup();
});

describe('ControlBar', () => {
	it('lays out the slotted TOC and deck pager in the bar', () => {
		render(ControlBarHost);
		const bar = document.querySelector('.ctrl-bar');
		expect(bar).toBeTruthy();
		expect(bar?.textContent).toContain('TOC');
		expect(bar?.textContent).toContain('NAV');
	});

	it('separates the TOC and pager groups with a divider', () => {
		render(ControlBarHost);
		expect(document.querySelector('.ctrl-bar-sep')).toBeTruthy();
	});

	it('pins the bar fully open and unpins back to auto-hide', async () => {
		render(ControlBarHost);
		const bar = document.querySelector('.ctrl-bar');
		expect(bar?.classList.contains('pinned')).toBe(false);

		await fireEvent.click(screen.getByLabelText('PIN off'));
		expect(get(controlBarPinned)).toBe(true);
		expect(bar?.classList.contains('pinned')).toBe(true);
		expect(screen.getByLabelText('PIN on')).toBeTruthy();

		await fireEvent.click(screen.getByLabelText('PIN on'));
		expect(get(controlBarPinned)).toBe(false);
		expect(bar?.classList.contains('pinned')).toBe(false);
	});

	it('pins independently of the tool bar', async () => {
		// Pinning the bottom bar must not seat the top — that is the whole point of the split.
		render(ControlBarHost);
		await fireEvent.click(screen.getByLabelText('PIN off'));
		expect(get(controlBarPinned)).toBe(true);
		expect(get(toolBarPinned)).toBe(false);
		expect(localStorage.getItem('controlBarPinned')).toBe('true');
		// Top bar was never toggled, so its key stays absent (still reads as unpinned).
		expect(localStorage.getItem('toolBarPinned')).toBeNull();
	});

	describe('bare', () => {
		beforeEach(() => {
			setChromeBareDeck(false);
			consoleLive.set(false);
			disarmChrome();
		});

		it('marks the control bar bare while a presenter console is live, and drops it after', async () => {
			render(ControlBarHost);
			const bar = document.querySelector('.ctrl-bar');
			expect(bar?.classList.contains('bare')).toBe(false);
			consoleLive.set(true);
			await tick();
			expect(bar?.classList.contains('bare')).toBe(true);
			consoleLive.set(false);
			await tick();
			expect(bar?.classList.contains('bare')).toBe(false);
		});

		it('stays bare when pinned, and Alt+. still arms it back into view', async () => {
			// "Nothing visible" beats PIN; the CSS lets only .armed (and the hover/focus that
			// follows it) override .bare, so both classes must be present together.
			controlBarPinned.set(true);
			setChromeBareDeck(true);
			render(ControlBarHost);
			const bar = document.querySelector('.ctrl-bar');
			expect(bar?.classList.contains('bare')).toBe(true);
			expect(bar?.classList.contains('pinned')).toBe(true);
			armChrome();
			await tick();
			expect(bar?.classList.contains('armed')).toBe(true);
			expect(bar?.classList.contains('bare')).toBe(true);
		});
	});
});
