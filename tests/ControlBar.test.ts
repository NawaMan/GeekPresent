// DOM tests for the ControlBar — the bottom-centre companion to the tool bar. It is a SHELL:
// SlideDeck fills it with the Table of Contents and the deck's ONE pager (here, stand-ins).
import { render, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ControlBarHost from './ControlBarHost.svelte';

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
});
