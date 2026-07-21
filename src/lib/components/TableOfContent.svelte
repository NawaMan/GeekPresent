<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }   from '$app/environment';
	import { onMount }   from 'svelte';
	import { onDestroy } from 'svelte';
	import { writable }  from 'svelte/store';

	import { page } from '$app/stores';
	import { visiblePages } from '$lib/utils/navigate';
	import type { Page } from '$lib/utils/navigate';
	import { currentSlidePath } from '$lib/utils/progressCore';
	import { searchDocs, type SearchDoc } from '$lib/utils/searchCore';
	import { deckSearchDocs } from '$lib/utils/searchIndex';
	import { tocOpenRequest } from '$lib/stores/chromeArm';


    export let pages: Array<Page> = [];

	/** The deck's folder name (e.g. "slides"), used to look this deck's slide text
	    out of the build-time search index. SlideDeck passes the name it already
	    derives from the URL; omit it and search simply finds nothing (the plain
	    list still works). */
	export let deck = '';

	/** Injection seam for tests: the searchable docs to filter. Left null in
	    production, where they are derived from the index for the current deck — so
	    a test can search deterministic text without depending on real slide files. */
	export let docs: Array<SearchDoc> | null = null;

	// Appendices (`hidden: true`) are reachable slides but not deck entries — the
	// TOC lists the linear order, the same one →/Space walks. Filtering here rather
	// than at the call site keeps every deck's TOC honest without each one
	// remembering to do it.
	$: listed = visiblePages(pages);

	// Which listed slide is the one on screen — so the TOC can mark it. The same
	// last-segment derivation SlideDeck uses for `currentSlide`, factored into
	// progressCore, so the highlight and the deck can't disagree about where we are.
	$: currentPath = currentSlidePath($page.url.pathname);

	// Search covers exactly what the TOC lists (the linear deck; appendices stay
	// out, same as the list). Text comes from the build-time index keyed by deck +
	// path; titles are the pages.ts titles the list already shows.
	let query = '';
	$: searchable = docs ?? deckSearchDocs(deck, listed);
	$: hits = searchDocs(searchable, query);
	$: searching = query.trim().length > 0;

	/** Show the extra link above the slide list. Off by default — only decks that
	    want it (e.g. a text.html article view, or a "back to home" link) enable it. */
	export let article = false;
	/** Hosted in SlideDeck's bottom ControlBar rather than the slide's top-left corner.
	    The trigger then sits inline in the bar and its flyout opens UPWARD, bounded to the
	    viewport (not the slide canvas, whose --canvas-h isn't defined in the overlay). */
	export let bar = false;
	/** Label for that link. */
	export let articleText = 'View as article';
	/** Href for that link. Relative to the current slide URL (e.g. `../text.html`
	    for the deck's article view, or `../` for the site root). */
	export let articleHref = '../text.html';

	let tocRef: HTMLElement;
	let isContentVisible = writable(false);

	// Alt+. then t — chrome arm requests the TOC open (state is local; this is the channel).
	const unsubTocReq = tocOpenRequest.subscribe((n) => {
		if (n > 0) isContentVisible.set(true);
	});

	function toggleTableOfContent() {
		isContentVisible.update(value => !value);
	}
	function turnOffTableOfContent() {
		isContentVisible.update(__ => false);
	}
	// Escape steps back one layer: a query clears first, an already-empty box
	// closes the menu — so Escape never yanks the whole menu shut while you are
	// mid-search.
	function escapeStep() {
		if (searching) query = '';
		else turnOffTableOfContent();
	}
	// Only consume Escape when the ToC is actually OPEN. It used to preventDefault
	// every Escape, open or shut — silently swallowing the key for every other
	// listener on the deck, since they all (rightly) skip an already-handled event.
	// A closed menu has no business claiming a key it is not using.
	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && $isContentVisible) {
			event.preventDefault();
			escapeStep();
		}
	}
	// The deck's own key handlers live on `window`: NavigationBar pages on the
	// arrow keys with NO input-focus guard, so a bare cursor-move in this box would
	// flip the slide. Keep every keystroke typed here from reaching them, and
	// handle Escape locally (stopping it before the global handler double-fires).
	function handleSearchKeydown(event: KeyboardEvent) {
		event.stopPropagation();
		if (event.key === 'Escape') {
			event.preventDefault();
			escapeStep();
		}
	}
	// Put the caret in the box the moment the menu opens, so it is type-to-search.
	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
	// Bring the highlighted (current) row into view when the menu opens — a deck deep
	// past the fold would otherwise hide the very mark this adds. `nearest` scrolls the
	// list, not the page.
	function scrollActiveIntoView(node: HTMLElement, active: boolean) {
		if (active && typeof node.scrollIntoView === 'function') {
			node.scrollIntoView({ block: 'nearest' });
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
		unsubTocReq();
		if (browser) {
			window.removeEventListener('keydown', handleGlobalKeydown);
			document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="toc gp-chrome no-print" class:expanded={$isContentVisible} class:bar bind:this={tocRef}>
	<CtrlBtn
		chrome
		text="Table of Contents"
		hoverText="Table of Contents"
		mnemonic="T"
		on:click={toggleTableOfContent}
		isSelected={$isContentVisible}
	/>

	{#if $isContentVisible}
	<div class="content">
		<!-- The head stays put; only the list beneath it scrolls, so the search box is
		     always reachable no matter how far down the results run. -->
		<div class="head">
			{#if article}
			<div id="article"><a href={articleHref}>{articleText}</a></div>
			{/if}
			<input
				class="search"
				type="search"
				placeholder="Search slides…"
				aria-label="Search slides"
				bind:value={query}
				on:keydown={handleSearchKeydown}
				use:focusOnMount
			/>
		</div>
		<div class="scroll">
			{#if searching}
				{#if hits.length}
				<ol class="results" aria-label="Search results">
					{#each hits as { path, title, snippet }}
						<li class:current={path === currentPath}>
							<a href={`./${path}`} aria-current={path === currentPath ? 'page' : undefined}>
								<span class="hit-title">{title}</span>
								{#if snippet}<span class="snippet">{snippet}</span>{/if}
							</a>
						</li>
					{/each}
				</ol>
				{:else}
				<p class="no-matches" role="status">No slides match “{query.trim()}”.</p>
				{/if}
			{:else}
			<ol>
				{#each listed as { path, title }}
					<li class:current={path === currentPath}>
						<a
							href={`./${path}`}
							aria-current={path === currentPath ? 'page' : undefined}
							use:scrollActiveIntoView={path === currentPath}
						>{title}</a>
					</li>
				{/each}
			</ol>
			{/if}
		</div>
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

	/* Hosted in the bottom ControlBar: the trigger sits inline in the bar's flex row and
	   the flyout opens UPWARD out of it. Bounded to the viewport — the slide's --canvas-h
	   is undefined in the window-fixed overlay, so it would fall back to the wrong 1080.

	   Height: ~half a viewport at most (min of 42vh and a roomy viewport remainder), so a
	   long deck scrolls inside the panel instead of covering the whole slide — especially
	   noticeable when the bars are PIN-locked open and the flyout has the full window to
	   grow into. The 10em remainder leaves room for both chrome bars + a bit of margin. */
	.toc.bar {
		position: relative;
		top: auto;
		left: auto;
		max-height: none;
	}
	.toc.bar .content {
		position: absolute;
		bottom: 100%;
		left: 0;
		margin-left: 0;
		margin-bottom: 4px;
		max-height: min(42vh, calc(100vh - 10em));
	}

	.toc .content {
		/* cosmetic */
		/* No horizontal padding here: the number gutter has to live INSIDE the scrolling
		   box, or its overflow clips the ol's hanging markers on the left (which is how the
		   page numbers went missing). The head and the list own their own insets instead. */
		padding: 0;
		margin: 0em;
		margin-left: 0.2em;
		border: 1.5px solid var(--toc-border, #CCCCCC);
		border-radius: 3px;
		color: var(--toc-fg, #111111);
		background-color: var(--toc-bg, #EEEEEE);
		/* A flex column so the head (article link + search box) stays put while only the
		   list beneath it scrolls. min-height:0 lets this flex child shrink below its
		   content height; the panel itself never scrolls — its .scroll child does. */
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	/* The pinned part: search box (and the optional article link). It never scrolls,
	   so the box is always reachable however long the list gets. */
	.toc .content .head {
		flex: none;
		padding: 0 1em;
	}

	/* The scrolling part: the slide list or the search results. Only a right inset here,
	   to keep the scrollbar off the text; the left number gutter is on the <ol> below. */
	.toc .content .scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding-right: 0.6em;
	}

	.toc .content ol {
		/* cosmetic */
		padding: 0px;
	}

	/* The numbered slide list keeps its number gutter as padding on the <ol> itself, so
	   the markers hang inside the scrolling box and survive its overflow clip. */
	.toc .content .scroll > ol:not(.results) {
		padding-left: 2em;
	}
	/* Results have no numbers (list-style:none); a small inset aligns them under the box. */
	.toc .content ol.results {
		padding-left: 0.8em;
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

	/* The slide you're on, marked in the list so the TOC doubles as a "you are here".
	   A tint of the deck accent over the panel, with the accent as the row's ink. */
	.toc .content ol li.current {
		background-color: var(--toc-current-bg, #CFE3F5);
	}
	.toc .content ol li.current > a {
		color: var(--toc-current-fg, #0B3A63);
		font-weight: 600;
	}
	.toc .content ol li.current:hover {
		background-color: var(--toc-current-bg, #CFE3F5);
	}

	/* Filter box. The TOC is a light chrome panel whatever the deck theme, so the
	   search tokens track the panel's own light fallbacks, not the dark-deck ones. */
	.toc .content .search {
		display: block;
		width: 100%;
		box-sizing: border-box;
		margin: 0.5em 0;
		padding: 0.3em 0.5em;
		font: inherit;
		color: var(--toc-fg, #111111);
		background-color: var(--toc-search-bg, #FFFFFF);
		border: 1.5px solid var(--toc-search-border, #CCCCCC);
		border-radius: 3px;
	}

	.toc .content .results {
		/* Results carry a snippet, so a row is a block, not a single line. */
		list-style: none;
	}
	.toc .content ol.results li a {
		display: block;
		padding: 0.25em 0.5em;
	}
	.toc .content .hit-title {
		display: block;
	}
	.toc .content .snippet {
		display: block;
		font-size: 0.8em;
		line-height: 1.3;
		opacity: 0.8;
		color: var(--toc-snippet-fg, #555555);
	}
	.toc .content .no-matches {
		margin: 0.25em 0.5em 0.5em;
		color: var(--toc-snippet-fg, #555555);
	}
</style>
