<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import CtrlBtn from '$lib/components/CtrlBtn.svelte';
	import Hint from '$lib/components/Hint.svelte';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { getPages } from '$lib/presentation';
	import { getPageNavigation } from '$lib/utils/navigate';
	import { navigate } from '$lib/utils/deckNav';
	import { currentSlidePath } from '$lib/utils/progressCore';
	import {
		exitHrefFromStack,
		resolveReturnStack
	} from '$lib/utils/appendixCore';

	/** Match SlideDeck deckName for this folder. */
	const DECK_ID = 'references-slide-pages';
	const FALLBACK = '../title.html';

	$: current = currentSlidePath($page.url.pathname) ?? 'closing.html';
	$: navigation = getPageNavigation(getPages() ?? [], current, './');
	$: pagesList = getPages() ?? [];

	$: returnStack = browser
		? resolveReturnStack($page.url.searchParams, DECK_ID, sessionStorage, pagesList)
		: [];
	// Pop one level (hub under nested calls); bare CATALOG when no stack.
	$: exitHref = exitHrefFromStack(returnStack, pagesList, null) || FALLBACK;
	$: exitLabel = returnStack.length ? 'RETURN' : 'CATALOG';

	function goCatalog() {
		navigate(exitHref);
	}

	// Same keys as AppendixPage leaving: ↑ and Backspace return to the caller.
	// Space / → ride the bar's nextLink (exit) — same as walking off the end of an appendix.
	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key !== 'Backspace' && event.key !== 'ArrowUp') return;
		const el = /** @type {HTMLElement | null} */ (event.target);
		if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
		event.preventDefault();
		goCatalog();
	}

	onMount(() => {
		if (browser) window.addEventListener('keydown', handleKeydown);
	});
	onDestroy(() => {
		if (browser) window.removeEventListener('keydown', handleKeydown);
	});
</script>

<TitlePage>
	<svelte:fragment slot="title">That’s the set</svelte:fragment>
	<svelte:fragment slot="subtitle">Title · Content · Empty · Appendix · Web · Video · Text</svelte:fragment>
	<svelte:fragment slot="subsubtitle">
		End of Slide Pages — RETURN (or Space / →) to the hub card that opened this deck
	</svelte:fragment>
</TitlePage>

<!-- Like Appendix RETURN: owns the bar so the control is findable, not muted chrome.
     nextLink = exit so NEXT / → / Space walk off the end of the deck the same way they
     leave an appendix — LAST stays empty (already on the last slide). -->
<NavigationBar
	firstLink={navigation.first ?? ''}
	prevLink={navigation.prev ?? ''}
	nextLink={exitHref}
	lastLink=""
>
	<CtrlBtn
		text={exitLabel}
		hoverText="Back to {exitHref.replace(/^\.\.\//, '/references/')}"
		on:click={goCatalog}
	/>
</NavigationBar>

<Hint text="{exitLabel} · NEXT · → · Space · ↑ · Backspace — leave the way an appendix does" />
