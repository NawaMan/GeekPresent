<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }   from '$app/environment';
	import { onMount }   from 'svelte';
	import { onDestroy } from 'svelte';
	import { writable }  from 'svelte/store';

	import type { PageNavigation } from '$lib/utils/navigate';


    export let pages: Array<{path: string, title: string}> = [];

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
	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
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

<div class="toc no-print" class:expanded={$isContentVisible} bind:this={tocRef}>
	<CtrlBtn chrome text="Table of Contents" hoverText="Table of Contents" on:click={toggleTableOfContent} isSelected={$isContentVisible} />

	{#if $isContentVisible}
	<div class="content">
		{#if article}
		<div id="article"><a href={articleHref}>{articleText}</a></div>
		{/if}
        <ol>
            {#each pages as { path, title }}
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
