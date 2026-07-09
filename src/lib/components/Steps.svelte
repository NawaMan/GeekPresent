<!--
  Steps — accumulating build reveal within a single slide (the classic reveal).

  Wrap a run of content in <Steps> and mark the pieces that should appear one at a
  time with <Fragment>. Everything outside a Fragment shows immediately; each
  Fragment starts hidden (but reserves its layout space, so nothing jumps) and
  fades in when the presenter taps SPACE. SHIFT+SPACE peels the last one back off.

    <script>
      import Steps    from '$lib/components/Steps.svelte';
      import Fragment from '$lib/components/Fragment.svelte';
    </script>

    <Steps>
      <p>Shown right away.</p>
      <Fragment tag="p">Appears on the first Space.</Fragment>
      <Fragment tag="p" transition="fly">Then this one.</Fragment>
    </Steps>

  Keys: Space builds up, Shift+Space steps back — chosen so the ARROW keys stay
  free for NavigationBar's slide paging (→/← always page the deck, whether or not a
  build is in progress). Space is a no-op once the build is exhausted; move on with
  →. Space is ignored while a form field or button has focus, so focused controls
  keep their normal Space behaviour. Use ONE Steps per slide with keys='global'
  (the default); for extra instances set keys='off' and drive them with bind:this.
  In `text` mode (a document artifact) every Fragment is shown at once and stepping
  is disabled — a document has no "current step".

  Coordinates its children over Svelte context, exactly like Carousel/CarouselItem,
  so authors just nest Fragments in document order.
-->
<script lang="ts">
	import { setContext, onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { getMode } from '$lib/presentation';

	/** Transition each Fragment uses unless it overrides its own. */
	export let transition: 'fade' | 'fly' | 'slide' | 'scale' | 'none' = 'fade';
	/** Reveal length in seconds (per Fragment default). */
	export let duration = 0.35;
	/** How many Fragments are showing at first (0 = all hidden, build from empty). */
	export let start = 0;
	/** Space/Shift+Space stepping. 'global' binds the whole deck (best: one Steps per
	    slide); 'off' disables keys so you can drive it with bind:this. */
	export let keys: 'global' | 'off' = 'global';
	/** Also advance when the presenter console relays a CONTINUE pulse (gp:continue). */
	export let continueKey = true;

	// A document artifact has no notion of a "current step": show everything, and
	// never touch the keyboard (it pages nothing).
	const isText = getMode() === 'text';

	// total: registered Fragment count. revealed: how many are currently showing.
	// Fragments subscribe to `revealed` and compare it to their own index.
	const total = writable(0);
	const revealed = writable(start);
	const defaults = writable({ transition, duration });
	$: defaults.set({ transition, duration });

	// Fragments register in document order during init, getting a stable index.
	function register(): number {
		let index = 0;
		total.update((n) => {
			index = n;
			return n + 1;
		});
		return index;
	}

	setContext('steps', { register, revealed, defaults });

	function clamp(n: number): number {
		return Math.max(0, Math.min($total, n));
	}

	/** Reveal the next hidden Fragment (no-op past the last). */
	export function next() {
		revealed.set(clamp($revealed + 1));
	}
	/** Hide the most recently revealed Fragment (no-op before the first). */
	export function prev() {
		revealed.set(clamp($revealed - 1));
	}
	/** Show exactly `n` Fragments (clamped). */
	export function goTo(n: number) {
		revealed.set(clamp(n));
	}
	/** Reveal every Fragment at once. */
	export function revealAll() {
		revealed.set($total);
	}
	/** Return to the initial `start` count. */
	export function reset() {
		revealed.set(clamp(start));
	}

	$: atStart = $revealed <= 0;
	$: atEnd = $revealed >= $total;

	// In text mode keep every Fragment shown as they register.
	$: if (isText && $revealed !== $total) revealed.set($total);

	// Skip focused controls so Space keeps its native meaning there (activate a
	// button, type a space in a field, …).
	function isInteractive(t: EventTarget | null): boolean {
		const el = t as HTMLElement | null;
		if (!el) return false;
		if (el.isContentEditable) return true;
		return /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName);
	}

	// Space builds up, Shift+Space steps back. The arrow keys are deliberately left
	// alone, so NavigationBar's paging (→/←) works whether or not a build is running.
	// We own Space here (preventDefault stops the browser's scroll-on-space); when
	// the build is spent it's simply a no-op and the presenter pages on with →.
	function onKeydown(e: KeyboardEvent) {
		if (e.defaultPrevented) return;
		if (e.code !== 'Space' && e.key !== ' ') return;
		if (isInteractive(e.target)) return;
		e.preventDefault();
		if (e.shiftKey) {
			if (!atStart) prev();
		} else if (!atEnd) {
			next();
		}
	}

	// A CONTINUE pulse (presenter console → gp:continue) advances the build too, so
	// a step-through works from the presenter window. Once exhausted it does
	// nothing here, leaving any slide-level onContinue to fire normally.
	function onContinue() {
		if (!atEnd) next();
	}

	onMount(() => {
		if (browser && !isText && keys === 'global') {
			window.addEventListener('keydown', onKeydown);
			if (continueKey) window.addEventListener('gp:continue', onContinue);
		}
	});
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', onKeydown);
			window.removeEventListener('gp:continue', onContinue);
		}
	});
</script>

<!-- display:contents → Steps adds no box of its own; Fragments lay out exactly
     where they sit in the parent's flow. -->
<div class="steps" style="display: contents;"><slot /></div>
