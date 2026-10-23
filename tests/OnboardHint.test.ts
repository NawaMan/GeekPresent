import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardHint from '../src/lib/components/OnboardHint.svelte';
import { onboardDone } from '../src/lib/stores/onboard';

// The hint watches a NEW viewer on the FIRST slide: it appears after the idle delay, or
// at once on a stray input, and any sign the viewer knows the way ends it for good (the
// persisted onboardDone flag). Timers are faked so "8 seconds of nothing" is instant.
const card = (root: ParentNode) => root.querySelector('.onboard-hint');
const edges = (root: ParentNode) => root.querySelectorAll('.edge');

const firstSlide = { offered: true, firstSlide: true, suppressed: false, delayMs: 8000 };

beforeEach(() => {
	vi.useFakeTimers();
	localStorage.clear();
	onboardDone.set(false);
});
afterEach(() => {
	vi.useRealTimers();
});

async function idle(ms: number) {
	vi.advanceTimersByTime(ms);
	await tick();
}

describe('OnboardHint', () => {
	it('stays hidden until the viewer has idled for the delay', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await idle(7999);
		expect(card(container)).toBeNull();
		await idle(1);
		expect(card(container)?.textContent).toContain('Space');
		expect(card(container)?.textContent).toContain('top');
		expect(edges(container).length).toBe(2);
	});

	it('a stray Enter brings it at once', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await tick();
		await fireEvent.keyDown(window, { key: 'Enter' });
		expect(card(container)).not.toBeNull();
	});

	it('a click on the slide brings it at once — a click on a link does not', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await tick();
		const link = document.createElement('a');
		document.body.appendChild(link);
		await fireEvent.pointerDown(link);
		expect(card(container)).toBeNull();
		await fireEvent.pointerDown(document.body);
		expect(card(container)).not.toBeNull();
		link.remove();
	});

	it('a scroll brings it at once', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await tick();
		await fireEvent.wheel(window);
		expect(card(container)).not.toBeNull();
	});

	it('a paging key marks the viewer as onboarded and never shows it', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await tick();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(get(onboardDone)).toBe(true);
		await idle(10000);
		expect(card(container)).toBeNull();
	});

	it('"Got it" dismisses it for good', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await idle(8000);
		const button = container.querySelector('.got-it') as HTMLButtonElement;
		await fireEvent.click(button);
		expect(card(container)).toBeNull();
		expect(get(onboardDone)).toBe(true);
		expect(localStorage.getItem('geekpresent:onboard:done')).toBe('true');
	});

	it('an onboarded viewer never sees it', async () => {
		onboardDone.set(true);
		const { container } = render(OnboardHint, { props: firstSlide });
		await fireEvent.keyDown(window, { key: 'Enter' });
		await idle(10000);
		expect(card(container)).toBeNull();
	});

	it('stays silent off the first slide, when suppressed, or when not offered', async () => {
		for (const props of [
			{ ...firstSlide, firstSlide: false },
			{ ...firstSlide, suppressed: true },
			{ ...firstSlide, offered: false }
		]) {
			const { container, unmount } = render(OnboardHint, { props });
			await fireEvent.keyDown(window, { key: 'Enter' });
			await idle(10000);
			expect(card(container)).toBeNull();
			unmount();
		}
	});

	it('suppression arriving later (a console goes live) takes it down', async () => {
		const { container, rerender } = render(OnboardHint, { props: firstSlide });
		await idle(8000);
		expect(card(container)).not.toBeNull();
		await rerender({ ...firstSlide, suppressed: true });
		expect(card(container)).toBeNull();
	});

	it('names Alt+. on its own line as the key for the tool bar and the nav bar', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await idle(8000);
		const line = card(container)?.querySelector('.alt-bars');
		expect(line?.textContent).toContain('Alt');
		expect(line?.textContent).toContain('tool bar');
		expect(line?.textContent).toContain('nav bar');
	});

	it('without bars it teaches only the keys', async () => {
		const { container } = render(OnboardHint, { props: { ...firstSlide, bars: false } });
		await idle(8000);
		expect(card(container)?.textContent).toContain('Space');
		expect(card(container)?.querySelector('.alt-bars')).toBeNull();
		expect(card(container)?.textContent).not.toContain('edge of the window');
		expect(edges(container).length).toBe(0);
	});

	it('force (?onboard) shows it at once, anywhere, to a viewer who already knows', async () => {
		onboardDone.set(true);
		const { container } = render(OnboardHint, {
			props: { ...firstSlide, firstSlide: false, offered: false, force: true }
		});
		await tick();
		expect(card(container)).not.toBeNull();
		// …and forgets that they knew, so the next plain visit starts fresh.
		expect(get(onboardDone)).toBe(false);
	});

	it('a forced hint stays until "Got it" or a paging key — not a click or a delay', async () => {
		for (const putAway of [
			(c: HTMLElement) => fireEvent.click(c.querySelector('.got-it') as HTMLButtonElement),
			() => fireEvent.keyDown(window, { key: ' ' })
		]) {
			const { container, unmount } = render(OnboardHint, { props: { ...firstSlide, force: true } });
			await tick();
			await fireEvent.pointerDown(document.body);
			await idle(10000);
			expect(card(container)).not.toBeNull();
			await putAway(container);
			expect(card(container)).toBeNull();
			expect(get(onboardDone)).toBe(true);
			unmount();
		}
	});

	it('a forced hint still stays off an audience screen', async () => {
		const { container } = render(OnboardHint, {
			props: { ...firstSlide, force: true, suppressed: true }
		});
		await tick();
		expect(card(container)).toBeNull();
	});

	it('is chrome: CAPTURE and print strip it', async () => {
		const { container } = render(OnboardHint, { props: firstSlide });
		await idle(8000);
		expect(card(container)?.classList.contains('gp-chrome')).toBe(true);
		expect(card(container)?.classList.contains('no-print')).toBe(true);
	});
});
