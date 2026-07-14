<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }   from '$app/environment';
	import { onMount }   from 'svelte';
	import { onDestroy } from 'svelte';
	import { writable }  from 'svelte/store';

	import { visiblePages } from '$lib/utils/navigate';
	import type { Page } from '$lib/utils/navigate';


    export let pages: Array<Page> = [];

	// Appendices (`hidden: true`) are reachable slides but not deck entries — the
	// TOC lists the linear order, the same one →/Space walks. Filtering here rather
	// than at the call site keeps every deck's TOC honest without each one
	// remembering to do it.
	$: listed = visiblePages(pages);

	/** Show the extra link above the slide list. Off by default — only decks that
	    want it (e.g. a text.html article view, or a "back to home" link) enable it. */
	export let article = false;
	/** Label for that link. */
	export let articleText = 'View as article';
	/** Href for that link. Relative to the current slide URL (e.g. `../text.html`
	    for the deck's article view, or `../` for the site root). */
	export let articleHref = '../text.html';

	let tocRef: HTMLElement;
	let isContentVisible = writable(false);

	function toggleTableOfContent() {
		isContentVisible.update(value => !value);
	}
	function turnOffTableOfContent() {
		isContentVisible.update(__ => false);
	}
	// Only consume Escape when the ToC is actually OPEN. It used to preventDefault
	// every Escape, open or shut — silently swallowing the key for every other
	// listener on the deck, since they all (rightly) skip an already-handled event.
	// A closed menu has no business claiming a key it is not using.
	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && $isContentVisible) {
			event.preventDefault();
			turnOffTableOfContent();
		}
	}
	function handleClickOutside(event: MouseEvent) {
		if (tocRef && !tocRef.contains(event.target as Node)) {
			turnOffTableOfContent();
		}
	}

	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleGlobalKeydown);
			document.addEventListener('click', handleClickOutside);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleGlobalKeydown);
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="toc gp-chrome no-print" class:expanded={$isContentVisible} bind:this={tocRef}>
	<CtrlBtn chrome text="Table of Contents" hoverText="Table of Contents" on:click={toggleTableOfContent} isSelected={$isContentVisible} />

	{#if $isContentVisible}
	<div class="content">
		{#if article}
		<div id="article"><a href={articleHref}>{articleText}</a></div>
		{/if}
        <ol>
            {#each listed as { path, title }}
                <li><a href={`./${path}`}>{title}</a></li>
            {/each}
        </ol>
	</div>
	{/if}
</div>

<style>
	.toc {
		/* functional */
		position: absolute;
		top: var(--ctrl-top, 12px);
		left:0px;
		margin:0px;
		padding: 0px;
		/* Sit above slide content (e.g. a DataTable's sticky header at z-index:1) so
		   the open menu is never overlapped; still below the screen-fixed overlay (50). */
		z-index: 40;
		/* Bound the TOC to the slide's own canvas height (--canvas-h, inherited from
		   SlideDeck; it lives inside the scaled content, so viewport units would be
		   wrong). A flex column keeps the button pinned at the top and lets the list
		   below scroll within whatever height is left. */
		display: flex;
		flex-direction: column;
		max-height: calc(var(--canvas-h, 1080px) - var(--ctrl-top, 12px) - 12px);
	}

	.toc .content {
		/* cosmetic */
		padding-left: 2em; /* The number will take some space so we have to prepare extra space. */
		padding-right: 1em;
		padding-top: 0em;
		padding-bottom: 0em;
		margin: 0em;
		margin-left: 0.2em;
		border: 1.5px solid var(--toc-border, #CCCCCC);
		border-radius: 3px;
		color: var(--toc-fg, #111111);
		background-color: var(--toc-bg, #EEEEEE);
		/* Scroll the list when it's taller than the space the flex column leaves;
		   min-height:0 lets this flex child shrink below its content height. */
		min-height: 0;
		overflow-y: auto;
	}

	.toc .content ol {
		/* cosmetic */
		padding: 0px;
	}

	a {
		/* cosmetic */
		text-decoration: none;
	}

	.toc .content ol li a {
		/* cosmetic */
		padding-left: 0.5em;
		padding-right: 0.5em;
	}
	#article:hover,
	.toc .content ol li:hover {
		background-color: var(--toc-row-hover-bg, #DDDDDD);
	}
</style>
