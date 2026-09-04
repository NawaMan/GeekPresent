// @vitest-environment node
//
// True server-side render of Typewriter (svelte/server, no DOM).
//
// This is the load-bearing test for the component's central claim: THE ANIMATION ONLY
// HIDES WHAT IS ALREADY THERE. The whole sentence must come from props alone, because
// that markup is what a handout prints, what a Text artifact ships, what a crawler reads,
// and what a reader with `prefers-reduced-motion` is left looking at. A typewriter that
// prerendered an empty box would be an animation that ate the content.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Typewriter from '../src/lib/components/Typewriter.svelte';

/** The visible text of the rendered run, tags stripped. */
const plain = (body: string) => body.replace(/<[^>]*>/g, '');

describe('Typewriter (SSR)', () => {
	it('prerenders the complete sentence, one span per character', () => {
		const { body } = render(Typewriter, { props: { text: 'Type me' } });
		expect(plain(body)).toContain('Type me');
		// `class="ch …"` — Svelte appends its scope hash, hence the loose tail.
		expect(body.match(/class="ch[ "]/g)).toHaveLength(7);
	});

	it('carries the schedule in the markup — the delays are props, not runtime state', () => {
		const { body } = render(Typewriter, { props: { text: 'ab', charMs: 10, startMs: 100 } });
		expect(body).toContain('--d:100ms; --w:10ms;');
		expect(body).toContain('--d:110ms; --w:10ms;');
	});

	it('renders the tag the author asked for', () => {
		const { body } = render(Typewriter, { props: { text: 'Big', tag: 'h1' } });
		expect(body).toContain('<h1');
		expect(body).toContain('</h1>');
	});

	it('a startOn typewriter prerenders HELD — no autoplay leaks into the built markup', () => {
		const { body } = render(Typewriter, { props: { text: 'later', startOn: 'punchline' } });
		expect(body).toContain('held');
		// …and the text is still all there: held is a paused clock, not missing content.
		expect(plain(body)).toContain('later');
	});

	it('typing={false} prerenders the text with neither the anim class nor a caret', () => {
		const { body } = render(Typewriter, { props: { text: 'Static', typing: false } });
		expect(body).not.toContain('anim');
		expect(body).not.toContain('class="rest"');
		expect(plain(body)).toContain('Static');
	});

	it('keeps authored newlines as characters, so `pre-wrap` can lay them out', () => {
		const { body } = render(Typewriter, { props: { text: 'a\nb' } });
		expect(plain(body)).toBe('a\nb');
	});

	it('is total on junk: no text renders an empty element, never "undefined"', () => {
		for (const text of [undefined, null, 42] as unknown[]) {
			const { body } = render(Typewriter, { props: { text } as never });
			expect(plain(body).trim()).toBe('');
		}
	});
});
