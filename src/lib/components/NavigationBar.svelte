<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }            from '$app/environment';
	import { onMount, onDestroy } from 'svelte';

	export let firstLink = '';
	export let prevLink  = '';
	export let nextLink  = '';
	export let lastLink  = '';
	export let onContinue: (() => void) | null = null;

	$: onFirst = () => firstLink && (window.location.href = firstLink);
	$: onPrev  = () => prevLink  && (window.location.href = prevLink);
	$: onNext  = () => nextLink  && (window.location.href = nextLink);
	$: onLast  = () => lastLink  && (window.location.href = lastLink);

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
		if (browser) {
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
</style>

<div class="nav no-print">
	<CtrlBtn text="FIRST"    on:click={onFirst}    isDisabled={!firstLink} />
	<CtrlBtn text="PREV"     on:click={onPrev}     isDisabled={!prevLink} />
	<CtrlBtn text="CONTINUE" on:click={onContinue} isDisabled={!onContinue} />
	<CtrlBtn text="NEXT"     on:click={onNext}     isDisabled={!nextLink} />
	<CtrlBtn text="LAST"     on:click={onLast}     isDisabled={!lastLink}/>
</div>
