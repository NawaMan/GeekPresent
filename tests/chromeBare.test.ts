import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
  chromeBare — the store both bars read. The sticky ?bare choice is read from localStorage
  once at module init, so "what a visitor sees when they come back" means seeding storage
  and re-importing.
*/

const fresh = async () => {
	vi.resetModules();
	const bare = await import('../src/lib/stores/chromeBare');
	const presenter = await import('../src/lib/stores/presenter');
	return { ...bare, ...presenter };
};

const url = (search: string) => new URL(`http://localhost/slides/title.html${search}`);

beforeEach(() => {
	localStorage.clear();
});

describe('chromeBare', () => {
	it('is off on a first visit with no console', async () => {
		const { chromeBare } = await fresh();
		expect(get(chromeBare)).toBe(false);
	});

	it('follows the presenter console coming and going', async () => {
		const { chromeBare, consoleLive } = await fresh();
		consoleLive.set(true);
		expect(get(chromeBare)).toBe(true);
		consoleLive.set(false);
		expect(get(chromeBare)).toBe(false);
	});

	it('follows the deck prop', async () => {
		const { chromeBare, setChromeBareDeck } = await fresh();
		setChromeBareDeck(true);
		expect(get(chromeBare)).toBe(true);
		setChromeBareDeck(false);
		expect(get(chromeBare)).toBe(false);
	});

	it('remembers ?bare across a slide with no flag and across a reload', async () => {
		const first = await fresh();
		first.applyBareParam(url('?bare'));
		expect(get(first.chromeBare)).toBe(true);
		first.applyBareParam(url(''));
		expect(get(first.chromeBare)).toBe(true);
		expect(localStorage.getItem('chromeBare')).toBe('true');

		const again = await fresh();
		expect(get(again.chromeBare)).toBe(true);
	});

	it('lets ?bare=off keep the bars while a console is live', async () => {
		const { chromeBare, consoleLive, applyBareParam } = await fresh();
		consoleLive.set(true);
		applyBareParam(url('?bare=off'));
		expect(get(chromeBare)).toBe(false);
	});

	it('ignores a corrupt stored value', async () => {
		localStorage.setItem('chromeBare', '{"x":1}');
		const { chromeBare } = await fresh();
		expect(get(chromeBare)).toBe(false);
	});

	it('tells the console what the audience shows, before and after its toggle', async () => {
		const { audienceBare, setBareChoice } = await fresh();
		expect(get(audienceBare)).toBe(true); // a live console hides them by default
		setBareChoice(false);
		expect(get(audienceBare)).toBe(false);
		expect(localStorage.getItem('chromeBare')).toBe('false');
	});

	it('follows a choice another window wrote, without a reload', async () => {
		const { chromeBare, consoleLive } = await fresh();
		consoleLive.set(true);
		expect(get(chromeBare)).toBe(true);
		// The console writes the key; this window only hears the storage event.
		localStorage.setItem('chromeBare', 'false');
		window.dispatchEvent(new StorageEvent('storage', { key: 'chromeBare', newValue: 'false' }));
		expect(get(chromeBare)).toBe(false);
	});
});
