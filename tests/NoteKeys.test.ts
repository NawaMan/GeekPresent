// The presenter console's keyboard cursor on the note lines: ↑/↓ move it, the line
// under it acts as a hovered one, Space checks and moves on. The console sends what
// was pressed as `gp:note-key` events (chrome/presenterKeyCore.ts decides which);
// <Note> owns the lines, so this drives it the way the console does.
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import NoteKeysHost from './NoteKeysHost.svelte';
import { presenterMode } from '../src/lib/stores/presenter';
import { highlightTarget, setHighlight } from '../src/lib/stores/highlightTarget';
import { lastTrigger } from '../src/lib/stores/triggers';
import { noteFocus } from '../src/lib/stores/noteFocus';
import { NOTE_KEY_EVENT, type NoteKeyAction } from '../src/lib/note/noteFocusCore';

const lines = (root: ParentNode) => [...root.querySelectorAll('.note li')] as HTMLElement[];
const send = (action: NoteKeyAction) =>
	window.dispatchEvent(new CustomEvent(NOTE_KEY_EVENT, { detail: action }));
const focused = (root: ParentNode) =>
	lines(root).findIndex((l) => l.classList.contains('gp-note-focus'));
const checked = (root: ParentNode) => lines(root).map((l) => l.classList.contains('gp-checked'));

beforeEach(() => {
	setHighlight(null);
	lastTrigger.set(null);
	noteFocus.set(null);
	presenterMode.set(true);
});
afterEach(() => {
	presenterMode.set(false);
	localStorage.clear();
});

async function mount() {
	const { container, unmount } = render(NoteKeysHost);
	await tick();
	return { root: container, unmount };
}

describe('Note — the keyboard cursor', () => {
	it('starts with no cursor, and numbers the lines for a script', async () => {
		const { root } = await mount();
		expect(focused(root)).toBe(-1);
		expect(get(noteFocus)).toBeNull();
		expect(lines(root).map((l) => l.getAttribute('data-note-line'))).toEqual(['0', '1', '2', '3']);
	});

	it('↓ and ↑ move it, and it stops at the ends', async () => {
		const { root } = await mount();
		send('down');
		expect(focused(root)).toBe(0);
		expect(get(noteFocus)).toBe(0);
		expect(lines(root)[0].getAttribute('aria-current')).toBe('true');
		send('down');
		send('down');
		send('down');
		send('down');
		expect(focused(root)).toBe(3);
		send('up');
		expect(focused(root)).toBe(2);
		expect(lines(root)[3].hasAttribute('aria-current')).toBe(false);
		expect(root.querySelectorAll('.gp-note-focus')).toHaveLength(1);
	});

	it('the line under the cursor lights its target, as a hover does', async () => {
		const { root } = await mount();
		send('down'); // line 0: data-highlight="db"
		expect(get(highlightTarget)).toBe('db');
		send('down'); // a plain line
		expect(get(highlightTarget)).toBeNull();
		send('down');
		send('down'); // line 3: data-highlight="cache"
		expect(get(highlightTarget)).toBe('cache');
		send('blur');
		expect(get(highlightTarget)).toBeNull();
		expect(focused(root)).toBe(-1);
		expect(get(noteFocus)).toBeNull();
	});

	it('Space checks the line, fires its trigger and moves on', async () => {
		const { root } = await mount();
		send('down');
		send('check');
		expect(checked(root)).toEqual([true, false, false, false]);
		expect(focused(root)).toBe(1);
		send('check');
		expect(get(lastTrigger)).toBeNull(); // neither line carried one
		send('check'); // line 2: data-trigger="save-cursor"
		expect(get(lastTrigger)?.name).toBe('save-cursor');
		expect(focused(root)).toBe(3);
		expect(get(highlightTarget)).toBe('cache');
		send('check'); // the last line: checked, and the cursor stays
		expect(get(lastTrigger)?.name).toBe('warm');
		expect(checked(root)).toEqual([true, true, true, true]);
		expect(focused(root)).toBe(3);
	});

	it('Space on a line already checked moves on without firing again', async () => {
		const { root } = await mount();
		send('down');
		send('down');
		send('down'); // line 2
		send('check');
		const first = get(lastTrigger);
		send('up'); // back onto line 2
		send('check');
		expect(get(lastTrigger)).toBe(first);
		expect(focused(root)).toBe(3);
	});

	it('Shift+Space takes the last check back', async () => {
		const { root } = await mount();
		send('down');
		send('check');
		send('check');
		expect(checked(root)).toEqual([true, true, false, false]);
		send('uncheck'); // cursor on 2 (unchecked) → step up to 1 and uncheck it
		expect(checked(root)).toEqual([true, false, false, false]);
		expect(focused(root)).toBe(1);
		send('uncheck');
		expect(checked(root)).toEqual([false, false, false, false]);
		expect(focused(root)).toBe(0);
		send('uncheck'); // nothing above: nothing happens
		expect(focused(root)).toBe(0);
	});

	it('Space and Shift+Space do nothing while the cursor is away', async () => {
		const { root } = await mount();
		send('check');
		send('uncheck');
		expect(checked(root)).toEqual([false, false, false, false]);
		expect(focused(root)).toBe(-1);
	});

	it('keeps the checks it made across a remount, and starts ↓ after them', async () => {
		const first = await mount();
		send('down');
		send('check');
		send('check');
		first.unmount();
		expect(get(noteFocus)).toBeNull();
		const { root } = await mount();
		expect(checked(root)).toEqual([true, true, false, false]);
		send('down');
		expect(focused(root)).toBe(2);
	});
});

describe('Note — the mouse and the cursor are one', () => {
	it('a hover shows the cursor but does not change what Space means', async () => {
		const { root } = await mount();
		const [db] = lines(root);
		db.dispatchEvent(new Event('pointerenter'));
		expect(focused(root)).toBe(0);
		expect(get(highlightTarget)).toBe('db');
		expect(get(noteFocus)).toBeNull(); // the console still reads "no cursor": Space continues
		db.dispatchEvent(new Event('pointerleave'));
		expect(focused(root)).toBe(-1);
		expect(get(highlightTarget)).toBeNull();
	});

	it('a key takes over from where the mouse is, and then the cursor stays', async () => {
		const { root } = await mount();
		const [db, plain] = lines(root);
		db.dispatchEvent(new Event('pointerenter'));
		send('down');
		expect(focused(root)).toBe(1);
		expect(get(noteFocus)).toBe(1);
		db.dispatchEvent(new Event('pointerleave'));
		expect(focused(root)).toBe(1);
		plain.dispatchEvent(new Event('pointerleave'));
		expect(focused(root)).toBe(1);
	});

	it('a click leaves the cursor on the line', async () => {
		const { root } = await mount();
		const cache = lines(root)[3];
		cache.dispatchEvent(new Event('pointerenter'));
		cache.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(get(noteFocus)).toBe(3);
		cache.dispatchEvent(new Event('pointerleave'));
		expect(focused(root)).toBe(3);
		expect(get(highlightTarget)).toBe('cache');
	});

	it('is not there at all outside the presenter console', async () => {
		presenterMode.set(false);
		const { root } = await mount();
		send('down');
		expect(root.querySelector('.gp-note-focus')).toBeNull();
		expect(get(noteFocus)).toBeNull();
	});
});
