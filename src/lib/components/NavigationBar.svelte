<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }            from '$app/environment';
	import { page }               from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { getMode, getViewTransitions, getPages } from '$lib/presentation';
	import { navigate as pageNavigate } from '$lib/utils/deckNav';
	import { presenterMode } from '$lib/stores/presenter';
	import { activeSteps } from '$lib/stores/activeSteps';
	import { spaceIntent } from '$lib/utils/stepKeys';

	export let firstLink = '';
	export let prevLink  = '';
	export let nextLink  = '';
	export let lastLink  = '';
	export let onContinue: (() => void) | null = null;
	/** Override the view transition used when paging FORWARD (NEXT / → / Space) and
	    BACKWARD (PREV / ←) from this slide.

	    Normally the effect comes from the LEAVING slide's own pages.ts entry, which is
	    right when a slide always leaves the same way. An AppendixPage is the exception:
	    the same NEXT is a step *within* the appendix on one slide and the appendix
	    *closing* on the next, and only the appendix knows which — a leaving slide
	    cannot see that the slide it leaves to lies outside the run. Unset (null) keeps
	    the pages.ts behaviour. */
	export let nextKind: string | null = null;
	export let prevKind: string | null = null;

	// In a Text artifact there are no slides to page through; the bar collapses
	// to a single TOP control that jumps back up the document.
	const mode = getMode();

	// Most decks page with a full-page load (route-per-slide, honest reload). A
	// deck that opted into setViewTransitions(true) instead navigates client-side
	// (goto) wrapped in the View Transitions API, so a slide animates into the next.
	const viewTransitions = getViewTransitions();
	const pages = getPages();

	// The current slide's chosen leave-transition, picked per DIRECTION: `transition`
	// going forward (→), `transitionBack` going back (←). Both default to 'slide'.
	// So a slide can show an effect forward and replay (or stay neutral) on the way
	// back. See pages.ts / view-transitions.css.
	$: currentPath = $page.url.pathname.replace(/\/+$/, '').split('/').pop() || '';
	$: currentPage = pages.find((p) => p.path === currentPath);

	type Dir = 'forward' | 'back';

	function kindFor(direction: Dir): string {
		const override = direction === 'back' ? prevKind : nextKind;
		if (override) return override;
		return (direction === 'back' ? currentPage?.transitionBack : currentPage?.transition) ?? 'slide';
	}

	// In the presenter console (?present) keep the flag across paging, so the
	// console stays the console; the audience window pages without it.
	function decorate(href: string): string {
		if (!href || !$presenterMode) return href;
		return href + (href.includes('?') ? '&' : '?') + 'present';
	}

	// Navigate to `href`, animating in `direction` when this deck uses view
	// transitions (delegated to the shared deckNav helper so a followed navigation
	// in SlideDeck animates identically).
	function navigate(href: string, direction: Dir) {
		pageNavigate(decorate(href), { viewTransitions, kind: kindFor(direction), direction });
	}

	$: onFirst = () => navigate(firstLink, 'back');
	$: onPrev  = () => navigate(prevLink,  'back');
	$: onNext  = () => navigate(nextLink,  'forward');
	$: onLast  = () => navigate(lastLink,  'forward');

	// CONTINUE is the in-slide step. A <Steps> build on this slide publishes itself
	// to `activeSteps` (it can't reach us over context — it's a sibling), so the
	// button reveals the next Fragment and greys out once the build is spent. Unlike
	// Space it never pages: CONTINUE is strictly the *within-slide* control, which is
	// why it disables instead of falling through to NEXT. A slide can still pass its
	// own onContinue hook; when both exist the click drives each of them once.
	$: steps = $activeSteps;
	$: canContinue = !!onContinue || !!steps?.hasNext;

	function doContinue() {
		if (steps?.hasNext) steps.next();
		onContinue?.();
	}

	function onTop() {
		// A Text artifact scrolls inside its own container; fall back to the window.
		const target = document.querySelector('[data-text-scroll]') ?? window;
		target.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft' && prevLink) {
			event.preventDefault();
			navigate(prevLink, 'back');

		} else if (event.key === 'ArrowRight' && nextLink) {
			event.preventDefault();
			navigate(nextLink, 'forward');

		} else {
			// Space advances: a <Steps> build swallows it while steps remain (that
			// listener acts on 'reveal'/'peel'), and once spent it falls to us and
			// pages the deck. Both listeners judge the SAME build state, so it does
			// not matter which of them the browser calls first.
			const intent = spaceIntent(event, steps ? { hasNext: steps.hasNext, hasPrev: steps.hasPrev } : null);
			if (intent === 'page-next' && nextLink) {
				event.preventDefault();
				navigate(nextLink, 'forward');
			} else if (intent === 'page-prev' && prevLink) {
				event.preventDefault();
				navigate(prevLink, 'back');
			}
		}
	}

	// A CONTINUE pulse relayed from the presenter console (SlideDeck turns it into
	// this DOM event) drives the same onContinue hook as the on-screen CONTINUE button.
	function handleRelayedContinue() {
		onContinue?.();
	}

	onMount(() => {
		// Arrow-key paging only makes sense between slides, not in a document.
		if (browser && mode !== 'text') {
			window.addEventListener('keydown', handleGlobalKeydown);
			window.addEventListener('gp:continue', handleRelayedContinue);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleGlobalKeydown);
			window.removeEventListener('gp:continue', handleRelayedContinue);
		}
	});
</script>

<style>
	.nav {
		/* functional */
		position: absolute;
		/* Vertical position knob: negative = lower, positive = higher. */
		bottom: -10px;
		left: 0px;
	}
	.nav.text {
		/* Pinned to the viewport so it stays reachable while scrolling. */
		position: fixed;
		/* Keep the text-mode TOP control flush with the viewport bottom (the slide
		   nav's downward nudge above doesn't apply here). */
		bottom: 0px;
		/* In text mode the bar is rendered outside the .text-page font-size lever,
		   so set the same base here to keep the TOP control sized like slide nav. */
		font-size: 1.5em;
	}
</style>

{#if mode === 'text'}
<div class="nav text gp-chrome no-print">
	<CtrlBtn chrome text="TOP" on:click={onTop} />
</div>
{:else}
<div class="nav gp-chrome no-print">
	<CtrlBtn chrome text="FIRST"    on:click={onFirst}    isDisabled={!firstLink} />
	<CtrlBtn chrome text="PREV"     on:click={onPrev}     isDisabled={!prevLink} />
	<CtrlBtn chrome text="CONTINUE" on:click={doContinue} isDisabled={!canContinue} />
	<CtrlBtn chrome text="NEXT"     on:click={onNext}     isDisabled={!nextLink} />
	<CtrlBtn chrome text="LAST"     on:click={onLast}     isDisabled={!lastLink}/>
	<!-- A slide with an EXTRA way to move gets to put its control here rather than
	     inventing a second bar somewhere else on the canvas: an AppendixPage's RETURN
	     sits at the end of this row, in the same padding, on the same baseline. -->
	<slot />
</div>
{/if}
