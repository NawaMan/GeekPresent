<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }            from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { getMode }            from '$lib/presentation';

	export let firstLink = '';
	export let prevLink  = '';
	export let nextLink  = '';
	export let lastLink  = '';
	export let onContinue: (() => void) | null = null;

	// In a Text artifact there are no slides to page through; the bar collapses
	// to a single TOP control that jumps back up the document.
	const mode = getMode();

	$: onFirst = () => firstLink && (window.location.href = firstLink);
	$: onPrev  = () => prevLink  && (window.location.href = prevLink);
	$: onNext  = () => nextLink  && (window.location.href = nextLink);
	$: onLast  = () => lastLink  && (window.location.href = lastLink);

	function onTop() {
		// A Text artifact scrolls inside its own container; fall back to the window.
		const target = document.querySelector('[data-text-scroll]') ?? window;
		target.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft' && prevLink) {
			event.preventDefault();
			window.location.href = prevLink;

		} else if (event.key === 'ArrowRight' && nextLink) {
			event.preventDefault();
			window.location.href = nextLink;
		}
	}

	onMount(() => {
		// Arrow-key paging only makes sense between slides, not in a document.
		if (browser && mode !== 'text') {
			window.addEventListener('keydown', handleGlobalKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleGlobalKeydown);
		}
	});
</script>

<style>
	.nav {
		/* functional */
		position: absolute;
		bottom: 0px;
		left: 0px;
	}
	.nav.text {
		/* Pinned to the viewport so it stays reachable while scrolling. */
		position: fixed;
	}
</style>

{#if mode === 'text'}
<div class="nav text no-print">
	<CtrlBtn text="TOP" on:click={onTop} />
</div>
{:else}
<div class="nav no-print">
	<CtrlBtn text="FIRST"    on:click={onFirst}    isDisabled={!firstLink} />
	<CtrlBtn text="PREV"     on:click={onPrev}     isDisabled={!prevLink} />
	<CtrlBtn text="CONTINUE" on:click={onContinue} isDisabled={!onContinue} />
	<CtrlBtn text="NEXT"     on:click={onNext}     isDisabled={!nextLink} />
	<CtrlBtn text="LAST"     on:click={onLast}     isDisabled={!lastLink}/>
</div>
{/if}
