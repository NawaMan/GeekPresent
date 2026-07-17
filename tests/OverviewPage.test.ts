import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewPageHost from './OverviewPageHost.svelte';
import OverviewPageDeckHost from './OverviewPageDeckHost.svelte';
import { overviewOpen } from '$lib/stores/overviewOpen';
import { canEditDeck, overviewEditMode } from '$lib/stores/pageEdit';

// The all-slides grid in a DOM. The pure decisions (fit-scale, tile list, key
// intent) are pinned in overviewCore.test.ts; what only a DOM can show is that the
// grid stays CLOSED until asked for, that opening it does not spray one document
// per slide into the page, and that the keys reach it without stealing anyone's.

/** Install a fake IntersectionObserver that hands back the nodes it was given. */
function stubObserver() {
	let cb: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void = () => {};
	let observed: Element[] = [];
	class FakeIO {
		constructor(c: typeof cb) {
			cb = c;
		}
		observe(n: Element) {
			observed.push(n);
		}
		unobserve(n: Element) {
			observed = observed.filter((o) => o !== n);
		}
		disconnect() {
			observed = [];
		}
	}
	vi.stubGlobal('IntersectionObserver', FakeIO);
	return {
		/** Scroll every currently-observed tile into view. */
		enterView: () => cb(observed.map((target) => ({ isIntersecting: true, target }))),
		observedCount: () => observed.length
	};
}

// Svelte compiles bind:clientWidth into a ResizeObserver, which jsdom has not got.
// The tile's measured box only feeds the fit-scale (unit-tested in the core), so an
// inert one is enough to let the component mount.
class FakeRO {
	observe() {}
	unobserve() {}
	disconnect() {}
}

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', FakeRO);
	// Dev-like default: EDIT is allowed unless a test forces the built-site refusal.
	canEditDeck.set(true);
	overviewEditMode.set(false);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	// Shared stores outlive a component's unmount — reset or one test leaks into the next.
	overviewOpen.set(false);
	overviewEditMode.set(false);
	canEditDeck.set(true);
});

const frames = () => [...document.querySelectorAll('iframe')];
const cards = () => [...document.querySelectorAll('.tile .card')].map((c) => c.textContent);
const scrim = () => document.querySelector('.scrim');
const openGrid = () => fireEvent.keyDown(window, { key: 'o' });

describe('OverviewPage — closed by default', () => {
	it('shows NOTHING: no button, no grid, and not one document booted', () => {
		stubObserver();
		const { container } = render(OverviewPageHost);

		// The grid has no toggle — it is a keystroke (`o`), not a control in the corner. What
		// it costs a slide it is not open on is therefore nothing at all.
		expect(container.querySelector('button')).toBeNull();
		expect(scrim()).toBeNull();
		expect(frames().length).toBe(0);
	});
});

describe('OverviewPage — opening it', () => {
	it('opens on `o` and lists the deck, appendices excluded', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();

		expect(scrim()).not.toBeNull();
		// The hidden appendix is a real slide but not part of the forward march, so
		// the grid — which is browsing — does not offer it.
		expect([...document.querySelectorAll('.tile .name')].map((n) => n.textContent)).toEqual([
			'Title',
			'Intro',
			'Outro'
		]);
		expect([...document.querySelectorAll('.tile .num')].map((n) => n.textContent)).toEqual([
			'1',
			'2',
			'3'
		]);
		expect(screen.getByText('3 slides')).toBeTruthy();
	});

	it('marks the slide we are standing on', async () => {
		stubObserver();
		render(OverviewPageHost, { props: { currentPath: 'outro.html' } });
		await openGrid();

		const current = document.querySelectorAll('.tile.current');
		expect(current.length).toBe(1);
		expect(current[0].querySelector('.name')?.textContent).toBe('Outro');
		expect(current[0].getAttribute('aria-current')).toBe('page');
	});
});

describe('OverviewPage — lazy mounting', () => {
	it('boots ONE document (the slide we are on) and leaves the rest as cards', async () => {
		stubObserver();
		render(OverviewPageHost, { props: { currentPath: 'intro.html' } });
		await openGrid();

		// The whole cost argument for LIVE tiles rests on this: opening a 65-slide
		// deck must not mount 65 SvelteKit documents. Nothing has scrolled into view
		// yet, so the only live one is the slide we are standing on — and it is live
		// immediately, so the grid opens already showing where you are.
		expect(frames().length).toBe(1);
		expect(frames()[0].getAttribute('src')).toBe('./intro.html?clean');
		// `?clean` is what stops a tile rendering its own chrome — including its own
		// OVERVIEW button and, recursively, a grid inside the grid.
		expect(cards()).toEqual(['Title', 'Outro']);
	});

	it('mounts a tile when it scrolls into view, and stops watching it', async () => {
		const io = stubObserver();
		render(OverviewPageHost, { props: { currentPath: 'intro.html' } });
		await openGrid();
		expect(io.observedCount()).toBe(3);

		io.enterView();
		await tick();

		// Every tile is now a real slide, and no card is left.
		expect(frames().map((f) => f.getAttribute('src'))).toEqual([
			'./title.html?clean',
			'./intro.html?clean',
			'./outro.html?clean'
		]);
		expect(cards()).toEqual([]);
		// Mounting is one-way: a mounted tile is no longer observed, so it can never
		// be torn down and re-booted just for drifting past.
		expect(io.observedCount()).toBe(0);
	});

	it('mounts eagerly where IntersectionObserver is absent — never a dead card', async () => {
		// Degrade to eager, never to blank: a card that can never resolve into its
		// slide is worse than the cost lazy mounting was there to avoid.
		vi.stubGlobal('IntersectionObserver', undefined);
		render(OverviewPageHost);
		await openGrid();
		await tick();

		expect(frames().length).toBe(3);
		expect(cards()).toEqual([]);
	});
});

describe('OverviewPage — closing it', () => {
	it('closes on Escape, even with the focus on a tile', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		(screen.getByRole('button', { name: /Outro/ }) as HTMLElement).focus();

		// Escape must work even though the focus sits on a tile BUTTON — which is
		// exactly why the grid uses its own typing guard rather than stepKeys' wider
		// isInteractiveTarget, which counts a button as interactive.
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(scrim()).toBeNull();
	});

	it('closes on `o` again — the key toggles', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.keyDown(window, { key: 'o' });
		expect(scrim()).toBeNull();
	});

	it('closes when a tile is clicked — the jump', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();

		await fireEvent.click(screen.getByRole('button', { name: /Outro/ }));
		// The grid gets out of the way; deckNav takes it from here.
		expect(scrim()).toBeNull();
	});

	it('closes when the scrim behind the grid is clicked', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();

		await fireEvent.click(scrim()!);
		expect(scrim()).toBeNull();
	});
});

describe('OverviewPage — Escape, with the rest of the deck listening too', () => {
	// THE REGRESSION. Every other test in this file mounts the grid ALONE — which is
	// exactly why they all passed while Escape was broken in the real deck.
	it('closes on Escape even though the ToC listens for Escape first', async () => {
		stubObserver();
		render(OverviewPageDeckHost);
		await openGrid();
		expect(scrim()).not.toBeNull();

		// The ToC mounts before the grid, so its window listener is called first. It
		// must not consume an Escape it is not using (it used to preventDefault every
		// one of them, open or shut) — and the grid must not defer to one if it does.
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(scrim()).toBeNull();
	});

	it('closes on Escape even with the ToC OPEN — the topmost overlay wins', async () => {
		stubObserver();
		render(OverviewPageDeckHost);
		await fireEvent.click(screen.getByRole('button', { name: /Table of Contents/i }));
		await openGrid();

		// Here the ToC legitimately DOES handle Escape — it is open, so it closes and
		// preventDefaults. The grid still closes: its Escape is judged on its own
		// state, never on whether another listener got there first.
		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(scrim()).toBeNull();
	});
});

describe('OverviewPage — EDIT deck mode', () => {
	it('shows an EDIT control when the grid is open', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		// Accessible name includes the E shortcut chip ("EDIT E").
		expect(screen.getByRole('button', { name: /EDIT/i })).toBeTruthy();
		// Browse mode has no dashed add tile and no remove chrome.
		expect(document.querySelector('.add-tile')).toBeNull();
		expect(document.querySelector('.tile-remove')).toBeNull();
	});

	it('enters EDIT mode and shows ADD, gutters, and remove chrome', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.click(screen.getByRole('button', { name: /EDIT/i }));
		await tick();

		expect(screen.getByRole('button', { name: /DONE/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'ADD' })).toBeTruthy();
		// One between-page + after each listed tile (not a corner badge / end tile).
		expect(document.querySelectorAll('.gutter-add').length).toBe(3);
		expect(document.querySelectorAll('.tile-remove').length).toBe(3);
		expect(document.querySelector('.add-tile')).toBeNull();
		expect(document.querySelector('.head-title')?.textContent).toBe('EDIT DECK');
	});

	it('toggles EDIT deck mode with the E key while the grid is open', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.keyDown(window, { key: 'e' });
		await tick();
		expect(document.querySelector('.gutter-add')).not.toBeNull();
		expect(document.querySelector('.head-title')?.textContent).toBe('EDIT DECK');

		await fireEvent.keyDown(window, { key: 'E' });
		await tick();
		expect(document.querySelector('.gutter-add')).toBeNull();
		expect(document.querySelector('.head-title')?.textContent).toBe('OVERVIEW PAGE');
	});

	it('answers NOT ALLOWED when the environment cannot write source', async () => {
		// Built-site path: same store pattern as ADJUST SAVE / canSave.
		canEditDeck.set(false);
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.click(screen.getByRole('button', { name: /EDIT/i }));
		await tick();

		expect(screen.getByRole('button', { name: /NOT ALLOWED/i })).toBeTruthy();
		// Did not enter edit mode.
		expect(document.querySelector('.gutter-add')).toBeNull();
		let mode = true;
		const unsub = overviewEditMode.subscribe((v) => (mode = v));
		unsub();
		expect(mode).toBe(false);
	});

	it('Esc leaves EDIT before closing the grid', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.click(screen.getByRole('button', { name: /EDIT/i }));
		await tick();
		expect(document.querySelector('.gutter-add')).not.toBeNull();

		await fireEvent.keyDown(window, { key: 'Escape' });
		// Still open, but no longer editing.
		expect(scrim()).not.toBeNull();
		expect(document.querySelector('.gutter-add')).toBeNull();
		expect(screen.getByRole('button', { name: /EDIT/i })).toBeTruthy();

		await fireEvent.keyDown(window, { key: 'Escape' });
		expect(scrim()).toBeNull();
	});

	it('opens the add form from the header ADD button', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.click(screen.getByRole('button', { name: /EDIT/i }));
		await fireEvent.click(screen.getByRole('button', { name: 'ADD' }));
		await tick();

		const form = document.querySelector('.add-form');
		expect(form).not.toBeNull();
		expect(form?.querySelector('.add-form-title')?.textContent).toBe('Add slide');
	});

	it('opens the add form from a between-page + gutter', async () => {
		stubObserver();
		render(OverviewPageHost);
		await openGrid();
		await fireEvent.click(screen.getByRole('button', { name: /EDIT/i }));
		await fireEvent.click(screen.getByRole('button', { name: /Add slide after Intro/i }));
		await tick();

		const form = document.querySelector('.add-form');
		expect(form).not.toBeNull();
		const after = form?.querySelector('select') as HTMLSelectElement | null;
		// Template select is first; After is the second select.
		const selects = form?.querySelectorAll('select') ?? [];
		expect((selects[1] as HTMLSelectElement | undefined)?.value).toBe('intro.html');
	});
});

describe('OverviewPage — keys it must not steal', () => {
	it('ignores `o` while the speaker is typing', async () => {
		stubObserver();
		render(OverviewPageHost);
		const input = document.createElement('input');
		document.body.appendChild(input);

		// The presenter console's timer box, a DataTable's search field: there, `o`
		// is a letter the user meant to type, not a command.
		await fireEvent.keyDown(input, { key: 'o' });
		expect(scrim()).toBeNull();
		input.remove();
	});

	it('leaves Ctrl/Cmd+O to the browser', async () => {
		stubObserver();
		render(OverviewPageHost);

		await fireEvent.keyDown(window, { key: 'o', ctrlKey: true });
		expect(scrim()).toBeNull();
		await fireEvent.keyDown(window, { key: 'o', metaKey: true });
		expect(scrim()).toBeNull();
	});

	it('leaves Escape alone when the grid is shut, so the ToC still gets it', async () => {
		stubObserver();
		render(OverviewPageHost);

		const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
		window.dispatchEvent(escape);
		// Not ours to consume — the deck's other Escape listeners (ToC, SizeMode,
		// Annotate) must still see it unprevented.
		expect(escape.defaultPrevented).toBe(false);
	});
});
