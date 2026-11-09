// The handout route prerenders one page per deck. A site with no deck (a blog, a single page)
// must still build: with nothing to list, a route marked `prerender = true` that the crawl never
// reaches fails the whole SvelteKit build. So it relaxes to 'auto' when there is no deck.
import { afterEach, describe, expect, it, vi } from 'vitest';

async function routeWith(decks: string[]) {
	vi.resetModules();
	vi.doMock('$lib/handout/handoutDecks', () => ({
		deckNames: () => decks,
		isDeck: (name: string) => decks.includes(name)
	}));
	return import('$lib/framework/handoutRoute');
}

afterEach(() => {
	vi.doUnmock('$lib/handout/handoutDecks');
	vi.resetModules();
});

describe('handoutRoute', () => {
	it('prerenders one handout per deck', async () => {
		const route = await routeWith(['slides', 'talk']);
		expect(route.prerender).toBe(true);
		expect(route.entries()).toEqual([{ deck: 'slides' }, { deck: 'talk' }]);
	});

	it("is only 'auto' on a site with no deck, so the build does not fail on it", async () => {
		const route = await routeWith([]);
		expect(route.prerender).toBe('auto');
		expect(route.entries()).toEqual([]);
	});
});
