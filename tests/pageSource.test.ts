import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';
import {
	pageSourceAvailable,
	pageSourceOpen,
	registerPageSource,
	unregisterPageSource,
	openPageSource,
	openPageSourceEdit
} from '$lib/stores/pageSource';

describe('pageSource store', () => {
	beforeEach(() => {
		// Reset by unregistering any leftover owners is not enough if a prior test
		// leaked — open starts false and we use fresh Symbols per test.
		pageSourceOpen.set(false);
	});

	it('is unavailable until something registers', () => {
		const a = Symbol('a');
		// Fresh registry assumption: only this suite's registers count once we clean up.
		// Register then unregister to prove the empty state.
		registerPageSource(a);
		unregisterPageSource(a);
		expect(get(pageSourceAvailable)).toBe(false);
	});

	it('becomes available when a ViewSource-style owner registers', () => {
		const owner = Symbol('vs');
		registerPageSource(owner);
		expect(get(pageSourceAvailable)).toBe(true);
		unregisterPageSource(owner);
		expect(get(pageSourceAvailable)).toBe(false);
	});

	it('stays available while any owner remains under SPA mount overlap', () => {
		const leaving = Symbol('old');
		const arriving = Symbol('new');
		registerPageSource(leaving);
		registerPageSource(arriving); // next slide mounts before old destroys
		unregisterPageSource(leaving);
		expect(get(pageSourceAvailable)).toBe(true);
		unregisterPageSource(arriving);
		expect(get(pageSourceAvailable)).toBe(false);
	});

	it('openPageSource opens only when something is registered', () => {
		pageSourceOpen.set(false);
		openPageSource();
		expect(get(pageSourceOpen)).toBe(false);

		const owner = Symbol('vs');
		registerPageSource(owner);
		openPageSource();
		expect(get(pageSourceOpen)).toBe(true);

		unregisterPageSource(owner);
		expect(get(pageSourceOpen)).toBe(false); // last owner leaves → closes
	});

	it('unregister is a no-op for an unknown owner', () => {
		const owner = Symbol('real');
		registerPageSource(owner);
		unregisterPageSource(Symbol('ghost'));
		expect(get(pageSourceAvailable)).toBe(true);
		unregisterPageSource(owner);
	});

	it('openPageSourceEdit invokes the registered opener', () => {
		const calls: number[] = [];
		const owner = Symbol('vs');
		registerPageSource(owner, () => calls.push(1));
		openPageSourceEdit();
		expect(calls).toEqual([1]);
		unregisterPageSource(owner);
		openPageSourceEdit(); // no opener left
		expect(calls).toEqual([1]);
	});
});
