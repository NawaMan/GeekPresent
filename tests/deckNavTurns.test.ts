// A page turn made while the previous view transition is still running must keep its
// own data-vt-kind: the superseded turn's cleanup may not clear the new turn's attributes.
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/record/recordBus', () => ({ reportGoto: vi.fn(), reportLeaving: vi.fn() }));

import { navigate } from '../src/lib/utils/deckNav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = any;

afterEach(() => {
	delete (document as unknown as Doc).startViewTransition;
	delete document.documentElement.dataset.vt;
	delete document.documentElement.dataset.vtKind;
});

describe('navigate() with view transitions', () => {
	it("a superseded turn does not clear the next turn's kind", async () => {
		const finish: Array<() => void> = [];
		(document as unknown as Doc).startViewTransition = (update: () => void) => {
			update();
			return { finished: new Promise<void>((resolve) => finish.push(resolve)) };
		};
		const root = document.documentElement;

		navigate('./b.html', { viewTransitions: true, kind: 'rise', direction: 'forward' });
		expect(root.dataset.vtKind).toBe('rise');

		navigate('./c.html', { viewTransitions: true, kind: 'left', direction: 'forward' });
		finish[0](); // the first turn was skipped by the second
		await Promise.resolve();
		await Promise.resolve();
		expect(root.dataset.vtKind).toBe('left');
		expect(root.dataset.vt).toBe('forward');

		finish[1]();
		await Promise.resolve();
		await Promise.resolve();
		expect(root.dataset.vtKind).toBeUndefined();
		expect(root.dataset.vt).toBeUndefined();
	});
});
