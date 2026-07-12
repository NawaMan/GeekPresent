import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import SlideDeck from '$lib/components/SlideDeck.svelte';
import { layoutMode, canLayout, canSave } from '$lib/stores/layoutMode';
import { reportChange, withdrawChange } from '$lib/stores/layoutChanges';

// The LAYOUT chrome across the dev/build boundary: which slides OFFER the control,
// how loudly the button announces itself, and what SAVE does where it cannot write.
//
// The regression underneath all of it: SAVE used to be gated on a bare
// `const canSave = import.meta.env.DEV`, which Vite folded to `false` in a build and
// dead-code-eliminated the whole button away — so a deployed LAYOUT demo showed the
// mode with a hole where its payoff should be. `canSave` is a settable store now,
// which is both why the refusal path survives the build AND why a test can reach it
// at all (`import.meta.env.DEV` is true under vitest).

const plain = [{ path: 'stub.html', title: 'Stub' }];
// The stub URL that tests/stubs/app-stores.ts serves is /slides/stub.html, so a page
// entry at 'stub.html' IS the current slide — which is what makes the per-slide
// `layout` flag reachable from here.
const teaches = [{ path: 'stub.html', title: 'Stub', layout: true }];

const buttons = (root: ParentNode) =>
	[...root.querySelectorAll('.slide-chrome button')] as HTMLButtonElement[];
const byLabel = (root: ParentNode, label: string) =>
	buttons(root).find((b) => b.textContent?.includes(label));

const mount = async (pages: typeof plain) => {
	const { container } = render(SlideDeck, { props: { pages } });
	await tick();
	return container;
};

beforeEach(() => {
	canLayout.set(true);
	layoutMode.set(true); // the speaker has flipped the mode on
	canSave.set(true);
});
afterEach(() => {
	layoutMode.set(false);
	canSave.set(true);
});

describe('which slides offer LAYOUT', () => {
	// LAYOUT is off in production by default. In THIS environment import.meta.env.DEV
	// is true, so the control is offered on every slide and the store recomputes to
	// true whatever we set — dev is the highest authority, and refusing to fake that is
	// the point. The precedence itself (including the ordinary-slide-in-a-build case,
	// which is unreachable here) is unit-tested purely in layoutAccess.test.ts.
	it('offers the control on an ordinary slide under dev, muted — not featured', async () => {
		const container = await mount(plain);
		expect(byLabel(container, 'LAYOUT')).toBeTruthy();
		expect(container.querySelector('.layout-btn.featured')).toBeNull();
		expect(container.querySelector('.slide-chrome.featuring')).toBeNull();
	});

	// A slide that TEACHES layout says so in its pages.ts entry, and its button is lit:
	// the slide is about to tell the audience to press it.
	it('features the button on a slide whose pages.ts entry sets layout: true', async () => {
		const container = await mount(teaches);
		expect(byLabel(container, 'LAYOUT')).toBeTruthy();
		expect(container.querySelector('.layout-btn.featured')).toBeTruthy();
	});

	// The load-bearing half of "make it visible". The /slides deck sets `fadeChrome`,
	// which drops .gp-chrome to opacity 0.12 until pointed at — that multiplies over
	// whatever colour the button wears, so without this exemption the featured styling
	// would be a 12% ghost on precisely the slides that tell the audience to look at it.
	it('opts a featuring slide OUT of the chrome fade', async () => {
		const container = await mount(teaches);
		expect(container.querySelector('.slide-chrome.featuring')).toBeTruthy();
	});

	// The halo says "find me", so it stops once it has been found — otherwise the chrome
	// keeps pulsing at the audience through the whole demo.
	it('pulses until LAYOUT is used, then stops', async () => {
		layoutMode.set(false);
		const container = await mount(teaches);
		expect(container.querySelector('.layout-btn.calling')).toBeTruthy();

		await fireEvent.click(byLabel(container, 'LAYOUT')!);
		await tick();
		expect(container.querySelector('.layout-btn.calling')).toBeNull();
		// Still featured, though — the pill geometry stays, so the row doesn't jiggle.
		expect(container.querySelector('.layout-btn.featured')).toBeTruthy();
	});

	// The whole cluster is gated on $canLayout. Flipped AFTER mount on purpose: setting
	// it before would be a lie this environment refuses to tell, since SlideDeck's own
	// recompute puts it straight back to true under dev.
	it('drops LAYOUT and SAVE entirely when the control is not offered', async () => {
		const container = await mount(teaches);
		canLayout.set(false);
		await tick();
		expect(byLabel(container, 'LAYOUT')).toBeUndefined();
		expect(container.querySelector('.save-btn')).toBeNull();
	});
});

describe('SAVE where it cannot write (a static build)', () => {
	it('renders as an ORDINARY, enabled button — not pre-emptively greyed out', async () => {
		canSave.set(false);
		const container = await mount(teaches);
		const save = byLabel(container, 'SAVE');
		expect(save).toBeTruthy();
		expect(save?.disabled).toBe(false);
		expect(container.querySelector('.save-btn.refused')).toBeNull();
	});

	// The beat the demo is built around: it answers when pressed. A button disabled from
	// the start invites the audience to assume the feature is missing or broken.
	it('answers NOT ALLOWED on click, with a tooltip saying why', async () => {
		canSave.set(false);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await tick();

		expect(byLabel(container, 'NOT ALLOWED')).toBeTruthy();
		expect(container.querySelector('.save-btn.refused')).toBeTruthy();
		expect(container.querySelector('.save-tip')?.textContent).toBe(
			'Save not allowed in this setup.'
		);
	});

	it('announces the refusal, rather than only drawing it', async () => {
		canSave.set(false);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await tick();
		expect(container.querySelector('.save-tip')?.getAttribute('role')).toBe('status');
	});
});

describe('SAVE under vite dev', () => {
	it('shows no refusal tooltip — it has a source tree to write to', async () => {
		const container = await mount(teaches);
		const save = byLabel(container, 'SAVE');
		expect(save?.disabled).toBe(false);
		expect(container.querySelector('.save-tip')).toBeNull();
		expect(container.querySelector('.save-btn.refused')).toBeNull();
	});
});

describe('SAVE follows the mode', () => {
	it('is absent while LAYOUT is off, in either world', async () => {
		layoutMode.set(false);
		canSave.set(false);
		const container = await mount(teaches);
		expect(container.querySelector('.save-btn')).toBeNull();
		expect(byLabel(container, 'NOT ALLOWED')).toBeUndefined();
	});
});

// A PARTIAL write is the outcome that can cost an author work. The server places
// what it can and reports the rest as `unmatched` — never guessing, which is the
// whole design of patchSource.ts. What it must NOT do is then flash SAVED at the
// author: the drags that didn't land are gone on the next reload, and the only
// evidence was a console.warn nobody had reason to open. (Lived, not theorised: a
// demo slide whose <QuickCode> sample was a byte-for-byte twin of its real Block —
// same name AND geometry — made the tag ambiguous, so one of two boxes silently
// failed to save while the button said SAVED. See tests/layoutPatch.test.ts.)
describe('SAVE that only half-lands', () => {
	const CHANGE_ID = 9001;
	let realFetch: typeof globalThis.fetch;

	/** onSave awaits saveLayout(), which awaits fetch() and then res.json() — two
	    microtask hops past the click. A bare tick() lands between them and reads the
	    button mid-flight, still saying SAVE. Flush the queue, THEN let Svelte render. */
	const settle = async () => {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	};

	/** The dev endpoint's verdict, whatever the real one would have said. */
	const serverSays = (patched: number, unmatched: string[]) => {
		globalThis.fetch = (() =>
			Promise.resolve(
				new Response(JSON.stringify({ patched, unmatched }), {
					status: 200,
					headers: { 'content-type': 'application/json' }
				})
			)) as typeof globalThis.fetch;
	};

	beforeEach(() => {
		realFetch = globalThis.fetch;
		// One dirty tag in the page registry — without it saveLayout() short-circuits
		// to NONE and never reaches the endpoint at all.
		reportChange({
			id: CHANGE_ID,
			kind: 'Block',
			name: 'pinned',
			dirty: true,
			oldTag: '<Block name="pinned" x={140} y={620} width={300} height={150}>',
			newTag: '<Block name="pinned" x={460} y={838} width={300} height={150}>',
			before: { x: 140, y: 620, width: 300, height: 150, z: 0 },
			after: { x: 460, y: 838, width: 300, height: 150, z: 0 }
		});
	});
	afterEach(() => {
		globalThis.fetch = realFetch;
		withdrawChange(CHANGE_ID);
	});

	it('counts what landed instead of claiming SAVED', async () => {
		serverSays(1, ['<Block name="pinned" x={460} y={838} width={300} height={150}>']);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await settle();

		expect(byLabel(container, '1 OF 2')).toBeTruthy();
		expect(byLabel(container, 'SAVED')).toBeUndefined();
	});

	it('wears the refusal styling and says what did not land, out loud', async () => {
		serverSays(1, ['<Block name="pinned" x={460} y={838} width={300} height={150}>']);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await settle();

		expect(container.querySelector('.save-btn.refused')).toBeTruthy();
		const tip = container.querySelector('.save-tip');
		expect(tip?.getAttribute('role')).toBe('status'); // announced, not merely drawn
		expect(tip?.textContent).toContain('1 tag not written');
		expect(tip?.textContent).not.toContain('Save not allowed'); // the OTHER refusal
	});

	it('pluralises the count, because "1 tags not written" reads as a bug', async () => {
		serverSays(1, ['<Block name="a" …>', '<Block name="b" …>']);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await settle();

		expect(byLabel(container, '1 OF 3')).toBeTruthy();
		expect(container.querySelector('.save-tip')?.textContent).toContain('2 tags not written');
	});

	it('still says SAVED — plainly — when every tag landed', async () => {
		serverSays(1, []);
		const container = await mount(teaches);
		await fireEvent.click(byLabel(container, 'SAVE')!);
		await settle();

		expect(byLabel(container, 'SAVED')).toBeTruthy();
		expect(container.querySelector('.save-btn.refused')).toBeNull();
		expect(container.querySelector('.save-tip')).toBeNull();
	});
});
