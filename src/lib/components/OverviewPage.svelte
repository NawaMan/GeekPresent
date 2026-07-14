<!--
  OverviewPage — the all-slides grid. The "press O" move: see the whole deck at once,
  click a slide to jump there.

  The tiles are LIVE: each is the real prerendered slide in an <iframe> at `?clean`
  (chrome off), rendered at native canvas size and CSS-scaled to fit its box — the
  same mechanism the presenter console already uses for its CURRENT/NEXT previews.
  Deliberately not screenshots: the only capture path in the repo writes to a
  gitignored /static/og, no deck sets a per-slide `image:`, and a thumbnail goes
  stale the moment its slide is edited. A live tile costs a document; a captured
  one costs a build step, a fresh clone showing an empty grid, and a lie.

  Embedding a slide is safe because SlideDeck gates every cross-window relay
  behind `isTopWindow` — a tile follows nobody and publishes nothing.

  Mounting is LAZY and one-way: a tile shows a cheap title card until it scrolls
  near the viewport, then keeps its iframe. So opening a 65-slide deck boots the
  dozen documents you can see, not 65.

  Lives in CANVAS space (absolute over the 1920x1080 content layer, like the ToC)
  rather than being window-fixed: the deck's scale transform lives on .content, and
  a `position: fixed` child of a transformed element anchors to that element, not
  the window. Canvas space also means the grid inherits the deck's theme tokens.
-->
<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';

	import { browser }   from '$app/environment';
	import { onMount }   from 'svelte';
	import { onDestroy } from 'svelte';

	import { navigate } from '$lib/utils/deckNav';
	import { getViewTransitions } from '$lib/presentation';
	import { overviewPageTiles, tileScale, overviewPageKeyIntent, mountedTiles } from '$lib/utils/overviewPageCore';
	import type { Page } from '$lib/utils/navigate';

	export let pages: Array<Page> = [];
	/** The deck's canvas size — tiles render the slide at this size and scale it down. */
	export let width  = 1920;
	export let height = 1080;
	/** The slide we're standing on (SlideDeck's `currentSlide`), so its tile is marked
	    and mounted straight away rather than filling in a beat later. */
	export let currentPath = '';

	const viewTransitions = getViewTransitions();

	let open = false;

	$: tiles = overviewPageTiles(pages, currentPath);
	$: currentNumber = tiles.find((t) => t.isCurrent)?.number ?? 0;

	// Which tiles have been seen near the viewport. `seen` is the raw observation;
	// `mounted` folds in the current slide (always live). Reassigned, not mutated,
	// so Svelte sees the change.
	let seen: Set<number> = new Set();

	// No IntersectionObserver (old browser) → mount every tile instead. Degrade to
	// EAGER, never to blank: a card that can never resolve into its slide is worse
	// than the cost lazy mounting was there to avoid. Same bargain WebSite strikes.
	let eagerAll = false;

	$: mounted = eagerAll
		? new Set(tiles.map((t) => t.number))
		: mountedTiles(seen, currentNumber);

	// Each tile's measured box, keyed by tile number. Kept OUT of the tile objects:
	// `tiles` is derived, so a recompute would throw away anything written onto it.
	let boxW: number[] = [];
	let boxH: number[] = [];

	// One shared observer over the scroll container. rootMargin gives a tile a
	// screenful of warning, so it is already rendered by the time it is looked at.
	let gridRef: HTMLElement | undefined;
	let observer: IntersectionObserver | undefined;
	// Tiles register here as they mount. The action can run BEFORE the observer
	// exists (a child's action fires before the parent's bind:this is assigned), so
	// the node list is the source of truth and the observer picks it up when it starts.
	const tileNodes = new Map<number, HTMLElement>();

	function observeTile(node: HTMLElement, number: number) {
		node.dataset.tile = String(number);
		tileNodes.set(number, node);
		observer?.observe(node);
		return {
			destroy() {
				tileNodes.delete(number);
				observer?.unobserve(node);
			}
		};
	}

	function startObserver() {
		if (!browser || typeof IntersectionObserver === 'undefined' || observer) return;
		observer = new IntersectionObserver(
			(entries) => {
				let changed = false;
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					const n = Number((e.target as HTMLElement).dataset.tile);
					if (Number.isFinite(n) && !seen.has(n)) {
						seen.add(n);
						changed = true;
					}
					// Mounting is one-way — stop watching a tile once it is live.
					observer?.unobserve(e.target);
				}
				if (changed) seen = new Set(seen);
			},
			{ root: gridRef ?? null, rootMargin: '400px 0px' }
		);
		for (const node of tileNodes.values()) observer.observe(node);
	}

	function toggle() {
		open = !open;
	}
	function close() {
		open = false;
	}

	function jump(path: string, number: number) {
		open = false;
		const direction = currentNumber > 0 && number < currentNumber ? 'back' : 'forward';
		navigate(`./${path}`, { viewTransitions, kind: 'slide', direction });
	}

	// `o` opens the grid, Escape closes it. The intent (and its guards — not while
	// typing, not when the browser owns the chord) lives in overviewCore so the rule
	// is stated once and testable without a DOM.
	function handleGlobalKeydown(event: KeyboardEvent) {
		const intent = overviewPageKeyIntent(event, open);
		if (intent === 'ignore') return;
		event.preventDefault();
		open = intent === 'open';
	}

	onMount(() => {
		if (!browser) return;
		window.addEventListener('keydown', handleGlobalKeydown);
		if (typeof IntersectionObserver === 'undefined') eagerAll = true;
	});
	onDestroy(() => {
		if (browser) window.removeEventListener('keydown', handleGlobalKeydown);
		observer?.disconnect();
		observer = undefined;
	});

	// The observer can only exist once the grid is in the DOM; tear it down on close
	// so a shut grid holds no callbacks.
	$: if (browser) {
		if (open && gridRef) startObserver();
		if (!open && observer) {
			observer.disconnect();
			observer = undefined;
		}
	}
</script>

<div class="overview-page gp-chrome no-print" class:expanded={open}>
	<CtrlBtn
		chrome
		text="OVERVIEW PAGE"
		hoverText={open ? 'Close overview (Esc)' : 'All slides (O)'}
		isSelected={open}
		on:click={toggle}
	/>
</div>

{#if open}
	<!-- The scrim covers the whole canvas. Clicking it (but not the grid) closes,
	     the same "click outside dismisses" the ToC has. -->
	<div
		class="scrim no-print"
		role="presentation"
		on:click|self={close}
		style="--canvas-w:{width}px; --canvas-h:{height}px;"
	>
		<div class="head">
			<span class="head-title">OVERVIEW PAGE</span>
			<span class="head-count">{tiles.length} slides</span>
			<span class="head-hint">click a slide · <kbd>Esc</kbd> to close</span>
		</div>

		<div class="grid" bind:this={gridRef}>
			{#each tiles as tile (tile.path)}
				<button
					type="button"
					class="tile"
					class:current={tile.isCurrent}
					use:observeTile={tile.number}
					on:click={() => jump(tile.path, tile.number)}
					aria-current={tile.isCurrent ? 'page' : undefined}
				>
					<!-- The box is measured; the slide inside it is rendered at native size
					     and scaled to fit, so a tile is a true miniature of the real slide. -->
					<span
						class="shot"
						style="aspect-ratio: {width} / {height};"
						bind:clientWidth={boxW[tile.number]}
						bind:clientHeight={boxH[tile.number]}
					>
						{#if mounted.has(tile.number)}
							<iframe
								class="frame"
								title={tile.title}
								src={tile.src}
								tabindex="-1"
								loading="lazy"
								style="width:{width}px; height:{height}px; transform: translate(-50%, -50%) scale({tileScale(
									boxW[tile.number] ?? 0,
									boxH[tile.number] ?? 0,
									width,
									height
								)});"
							></iframe>
						{:else}
							<!-- The cheap card a tile wears until it is worth a document. -->
							<span class="card">{tile.title}</span>
						{/if}
					</span>
					<span class="label">
						<span class="num">{tile.number}</span>
						<span class="name">{tile.title}</span>
					</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* The toggle. Sits under the ToC's button (which owns the top-left corner), so
	   the two slide-list controls read as a pair. */
	.overview-page {
		/* functional */
		position: absolute;
		top: calc(var(--ctrl-top, 12px) + 2.1em);
		left: 0px;
		margin: 0px;
		padding: 0px;
		z-index: 40;
	}

	.scrim {
		/* functional */
		position: absolute;
		inset: 0;
		/* Above the slide, the ToC (40) and the ink — but below the screen-fixed
		   overlay (50), so DISPLAY and the minimap stay reachable with it open. */
		z-index: 45;
		display: flex;
		flex-direction: column;

		/* cosmetic */
		background: var(--overview-page-scrim-bg, #0C0F13F2);
		padding: 2em 2.2em;
		gap: 1.2em;
	}

	.head {
		/* functional */
		display: flex;
		align-items: baseline;
		gap: 1em;
		flex: none;

		/* cosmetic */
		color: var(--overview-page-head-fg, #E6EDF3);
		font-size: 1.1em;
	}
	.head-title {
		/* cosmetic */
		font-weight: bold;
		letter-spacing: 0.08em;
	}
	.head-count,
	.head-hint {
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
		font-size: 0.8em;
	}
	.head-hint {
		/* functional */
		margin-left: auto;
	}
	kbd {
		/* cosmetic */
		border: 1px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 3px;
		padding: 0 0.35em;
	}

	.grid {
		/* functional */
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.4em;
		/* The grid is the only thing that scrolls; min-height:0 lets this flex child
		   shrink below its content height so it actually can. */
		min-height: 0;
		overflow-y: auto;
		padding-right: 0.4em;
	}

	.tile {
		/* functional */
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0;
		cursor: pointer;
		text-align: left;

		/* cosmetic */
		background: none;
		border: none;
		font: inherit;
		color: inherit;
	}

	.shot {
		/* functional */
		display: block;
		position: relative;
		overflow: hidden;
		width: 100%;

		/* cosmetic */
		background: var(--overview-page-tile-bg, #14181D);
		border: 1.5px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 4px;
	}
	.tile:hover .shot,
	.tile:focus-visible .shot {
		/* cosmetic */
		border-color: var(--overview-page-tile-hover-border, #2980B9);
	}
	.tile.current .shot {
		/* cosmetic */
		border-color: var(--overview-page-current-border, #00B356);
		box-shadow: 0 0 0 2px var(--overview-page-current-border, #00B356);
	}

	.frame {
		/* functional */
		position: absolute;
		top: 50%;
		left: 50%;
		transform-origin: center center;
		border: 0;
		/* A tile is a preview, not a document you interact with — the click belongs
		   to the button underneath, which is what jumps. */
		pointer-events: none;
	}

	.card {
		/* functional */
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		/* cosmetic */
		padding: 0.8em;
		text-align: center;
		color: var(--overview-page-dim-fg, #8A99A8);
		font-size: 0.9em;
	}

	.label {
		/* functional */
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		flex: none;

		/* cosmetic */
		font-size: 0.8em;
		color: var(--overview-page-head-fg, #E6EDF3);
	}
	.num {
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
		font-variant-numeric: tabular-nums;
	}
	.name {
		/* functional */
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tile.current .num,
	.tile.current .name {
		/* cosmetic */
		color: var(--overview-page-current-border, #00B356);
	}
</style>
