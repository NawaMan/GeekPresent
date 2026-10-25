// The deck pager's other keys: Home/End (and Cmd+↑/↓) jump like FIRST/LAST, and
// PageUp/PageDown — a presentation clicker — page like ←/→. Asserted on the deckNav
// seam, since jsdom cannot follow window.location.
import { render, cleanup } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NavigationBar from '../src/lib/components/NavigationBar.svelte';
import { localNav } from '../src/lib/stores/localChrome';

const navigate = vi.fn();
vi.mock('$lib/utils/deckNav', () => ({ navigate: (...args: unknown[]) => navigate(...args) }));

afterEach(() => {
	cleanup();
	localNav.set(new Set());
	navigate.mockClear();
});

const links = { firstLink: 'a.html', prevLink: 'b.html', nextLink: 'd.html', lastLink: 'z.html' };
const press = (key: string, mods: KeyboardEventInit = {}, target: EventTarget = window) =>
	target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }));
const went = () => navigate.mock.calls.map((c) => [c[0], c[1].direction]);

describe('NavigationBar — Home / End / PageUp / PageDown', () => {
	it('Home and End go to the first and last slide', () => {
		render(NavigationBar, { props: { deckLevel: true, ...links } });
		press('Home');
		press('End');
		expect(went()).toEqual([['a.html', 'back'], ['z.html', 'forward']]);
	});

	it('Cmd+↑ and Cmd+↓ do the same (the Mac chord)', () => {
		render(NavigationBar, { props: { deckLevel: true, ...links } });
		press('ArrowUp', { metaKey: true });
		press('ArrowDown', { metaKey: true });
		expect(went()).toEqual([['a.html', 'back'], ['z.html', 'forward']]);
	});

	it('PageUp lands on the previous slide spent, as ← does; PageDown pages forward', () => {
		render(NavigationBar, { props: { deckLevel: true, ...links } });
		press('PageUp');
		press('PageDown');
		expect(went()).toEqual([['b.html', 'back'], ['d.html', 'forward']]);
		expect(navigate.mock.calls[0][1].arriveAtEnd).toBe(true);
	});

	it('does nothing on the first slide (no FIRST link) and leaves the key to the browser', () => {
		render(NavigationBar, { props: { deckLevel: true, nextLink: 'd.html', lastLink: 'z.html' } });
		const e = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
		window.dispatchEvent(e);
		expect(navigate).not.toHaveBeenCalled();
		expect(e.defaultPrevented).toBe(false);
	});

	it('yields to a control that claimed the key, and to a focused field', () => {
		render(NavigationBar, { props: { deckLevel: true, ...links } });
		const claimed = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
		claimed.preventDefault();
		window.dispatchEvent(claimed);
		const input = document.body.appendChild(document.createElement('input'));
		press('End', {}, input);
		input.remove();
		expect(navigate).not.toHaveBeenCalled();
	});
});
