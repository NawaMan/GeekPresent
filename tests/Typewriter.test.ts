import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TypewriterHost from './TypewriterHost.svelte';
import { fireTrigger, lastTrigger } from '../src/lib/stores/triggers';

// The DOM half of Typewriter. (The schedule is typewriterCore.test.ts; the prerendered
// sentence is TypewriterSsr.ssr.test.ts.)
//
// Two things are worth defending here, and neither needs a real clock:
//
// 1. NO TIMER FILLS THE TEXT IN. Every character is in the DOM on the first frame, each
//    carrying its own delay as a custom property; the CSS hides what has not landed yet.
//    That is what makes the AnimationBar able to scrub it, and it is why these assertions
//    are on markup rather than on anything ticking.
// 2. The un-animated state is the FINISHED text — `typing={false}`, a `text` artifact, a
//    reader with reduced motion and the server all land on the same complete sentence.
//
// Component styles are not injected in this project's DOM setup, so nothing here can (or
// should) assert on computed visibility — the classes and the custom properties are the
// contract the stylesheet keys off.

const chars = (root: ParentNode) => Array.from(root.querySelectorAll('.ch')) as HTMLElement[];
const runText = (root: ParentNode) => chars(root).map((c) => c.textContent).join('');
const root = (c: ParentNode) => c.querySelector('.typewriter') as HTMLElement;
const restCaret = (c: ParentNode) => c.querySelector('.rest');
// The two customs the stylesheet reads. Asked for through the parsed style declaration,
// not the raw attribute: the DOM normalizes `--d:100ms;` to `--d: 100ms;` on the way in.
const delayOf = (el: HTMLElement) => el.style.getPropertyValue('--d').trim();
const windowOf = (el: HTMLElement) => el.style.getPropertyValue('--w').trim();

afterEach(() => {
	cleanup();
	lastTrigger.set(null);
});

describe('Typewriter — the text is all there, one span per character', () => {
	it('renders a span per character, in order, reassembling to the original text', () => {
		const { container } = render(TypewriterHost, { props: { props: { text: 'Hi you' } } });
		expect(chars(container)).toHaveLength(6);
		expect(runText(container)).toBe('Hi you');
	});

	it('keeps an emoji whole — one span, not two broken halves', () => {
		const { container } = render(TypewriterHost, { props: { props: { text: 'a🚀' } } });
		expect(chars(container)).toHaveLength(2);
		expect(chars(container)[1].textContent).toBe('🚀');
	});

	it('hands each character its own window as custom properties, staggered', () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'abc', charMs: 10, startMs: 100 } }
		});
		expect(chars(container).map(delayOf)).toEqual(['100ms', '110ms', '120ms']);
		expect(windowOf(chars(container)[0])).toBe('10ms');
	});

	it('parks the resting caret at the end of the envelope', () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'abc', charMs: 10, startMs: 100 } }
		});
		expect(delayOf(restCaret(container) as HTMLElement)).toBe('130ms');
	});

	it('renders the requested tag, and forwards style / id / class', () => {
		const { container } = render(TypewriterHost, {
			props: {
				props: { text: 'Hi', tag: 'h1', id: 'lede', class: 'big', style: 'font-size: 40px;' }
			}
		});
		const el = root(container);
		expect(el.tagName).toBe('H1');
		expect(el.id).toBe('lede');
		expect(el.classList.contains('big')).toBe(true);
		expect(el.getAttribute('style')).toContain('font-size: 40px;');
	});
});

describe('Typewriter — when it does not animate, it is simply the text', () => {
	it('typing={false} drops the anim class and the caret, keeping every character', () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'Hi you', typing: false } }
		});
		expect(root(container).classList.contains('anim')).toBe(false);
		expect(restCaret(container)).toBeNull();
		expect(runText(container)).toBe('Hi you');
	});

	it('a `text` artifact prints it whole — nobody types at the reader', () => {
		const { container } = render(TypewriterHost, {
			props: { mode: 'text', props: { text: 'Hi you' } }
		});
		expect(root(container).classList.contains('anim')).toBe(false);
		expect(runText(container)).toBe('Hi you');
	});

	it('caret={false} keeps the reveal but marks the root so no caret is drawn', () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'Hi', caret: false } }
		});
		expect(root(container).classList.contains('anim')).toBe(true);
		expect(root(container).classList.contains('no-caret')).toBe(true);
		expect(restCaret(container)).toBeNull();
	});

	it('no text is an empty run, not the word "undefined"', () => {
		const { container } = render(TypewriterHost, { props: { props: {} } });
		expect(chars(container)).toHaveLength(0);
		expect(root(container).textContent?.trim()).toBe('');
		expect(root(container).classList.contains('anim')).toBe(false);
	});
});

describe('Typewriter — startOn holds it until a named pulse', () => {
	const held = (c: ParentNode) => root(c).classList.contains('held');

	it('waits, frozen at frame 0, until its own trigger fires', async () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'later', startOn: 'punchline' } }
		});
		expect(held(container)).toBe(true);

		fireTrigger('punchline');
		await tick();
		expect(held(container)).toBe(false);
	});

	it('ignores another element’s trigger — and does not relapse when one fires later', async () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'later', startOn: 'punchline' } }
		});

		fireTrigger('something-else');
		await tick();
		expect(held(container)).toBe(true);

		fireTrigger('punchline');
		await tick();
		expect(held(container)).toBe(false);

		// The store's single module-wide slot moves on; this one must stay released.
		fireTrigger('something-else');
		await tick();
		expect(held(container)).toBe(false);
	});

	it('a fresh pulse re-creates the spans, which is how a CSS animation replays', async () => {
		const { container } = render(TypewriterHost, {
			props: { props: { text: 'again', startOn: 'punchline' } }
		});

		fireTrigger('punchline');
		await tick();
		const first = chars(container)[0];

		fireTrigger('punchline');
		await tick();
		const second = chars(container)[0];

		expect(second).not.toBe(first); // a new element — a new animation, from the top
		expect(runText(container)).toBe('again');
	});

	it('without startOn it types on mount — nothing to wait for', () => {
		const { container } = render(TypewriterHost, { props: { props: { text: 'now' } } });
		expect(held(container)).toBe(false);
		expect(root(container).classList.contains('anim')).toBe(true);
	});
});
