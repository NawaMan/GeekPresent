<!--
  OverviewPage — the all-slides grid. The "press O" move: see the whole deck at once,
  click a slide to jump there.

  Phase 1 also offers EDIT DECK (dev only): add a slide (scaffold + pages.ts) or
  unlist one. Static hosts show the control and refuse with NOT ALLOWED — same
  bargain as ADJUST SAVE. See specs/DECK-EDIT-1.md.

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

	import { browser }   from '$app/environment';
	import { onMount }   from 'svelte';
	import { onDestroy } from 'svelte';

	import { navigate } from '$lib/utils/deckNav';
	import { overviewOpen } from '$lib/stores/overviewOpen';
	import {
		canEditDeck,
		overviewEditMode,
		addPage,
		removePage
	} from '$lib/stores/pageEdit';
	import {
		slugifyStem,
		normalizeSlidePath,
		type PageTemplate
	} from '$lib/deckEdit/pageEditCore';
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
	/** Deck folder name under src/routes (e.g. "slides") — required for EDIT writes. */
	export let deck = '';

	const viewTransitions = getViewTransitions();

	// Open state lives in a shared store so the OVERVIEW item in the tool flyout can drive it
	// too, not just the `o` key. See stores/overviewOpen.


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

	// ── EDIT DECK state ──────────────────────────────────────────────────────────
	let showAddForm = false;
	let addTitle = '';
	let addPath = '';
	let addTemplate: PageTemplate = 'content';
	/** "" = append; otherwise path of the slide to insert after. */
	let addAfter = '';
	let pathTouched = false;
	let busy = false;
	let statusMsg = '';
	let statusKind: 'info' | 'error' | 'ok' = 'info';
	/** After a successful add, offer (or take) a jump to the new slide. */
	let pendingOpenPath = '';
	/** Form default: open the new slide after it is created. */
	let openAfterAdd = true;
	/** Flash label on the EDIT button (NOT ALLOWED). */
	let editFlash = '';
	let editFlashTip = '';
	let editFlashTimer: ReturnType<typeof setTimeout> | undefined;

	$: if (!pathTouched && addTitle) {
		addPath = `${slugifyStem(addTitle)}.html`;
	}

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

	function close() {
		showAddForm = false;
		overviewEditMode.set(false);
		statusMsg = '';
		pendingOpenPath = '';
		overviewOpen.set(false);
	}

	function leaveEdit() {
		showAddForm = false;
		statusMsg = '';
		pendingOpenPath = '';
		overviewEditMode.set(false);
	}

	function flashNotAllowed() {
		editFlash = 'NOT ALLOWED';
		editFlashTip = 'Edit deck only works in vite dev — a static host has no source tree.';
		if (editFlashTimer) clearTimeout(editFlashTimer);
		editFlashTimer = setTimeout(() => {
			editFlash = '';
			editFlashTip = '';
		}, 2600);
	}

	function toggleEdit() {
		if (!$canEditDeck) {
			flashNotAllowed();
			return;
		}
		if ($overviewEditMode) leaveEdit();
		else {
			overviewEditMode.set(true);
			statusMsg = '';
		}
	}

	function openAddForm(afterPath: string = '') {
		if (!$canEditDeck) {
			flashNotAllowed();
			return;
		}
		if (!$overviewEditMode) overviewEditMode.set(true);
		addTitle = '';
		addPath = 'slide.html';
		addTemplate = 'content';
		addAfter = afterPath;
		pathTouched = false;
		openAfterAdd = true;
		pendingOpenPath = '';
		showAddForm = true;
		statusMsg = '';
	}

	function cancelAddForm() {
		showAddForm = false;
		statusMsg = '';
	}

	async function submitAdd() {
		if (!$canEditDeck) {
			flashNotAllowed();
			return;
		}
		if (!deck) {
			statusKind = 'error';
			statusMsg = 'No deck name — cannot write pages.ts.';
			return;
		}
		const path = normalizeSlidePath(addPath);
		if (!path) {
			statusKind = 'error';
			statusMsg = 'Path must look like my-slide.html (lowercase, hyphens).';
			return;
		}
		const title = addTitle.trim();
		if (!title) {
			statusKind = 'error';
			statusMsg = 'Title is required.';
			return;
		}
		const goOpen = openAfterAdd;
		busy = true;
		statusKind = 'info';
		statusMsg = 'Adding…';
		const res = await addPage({
			deck,
			path,
			title,
			template: addTemplate,
			after: addAfter || null
		});
		busy = false;
		if (res.error) {
			statusKind = 'error';
			statusMsg = res.error;
			return;
		}
		showAddForm = false;
		if (goOpen) {
			// Files are on disk; Vite/SvelteKit will pick up the route. Jump so the author
			// lands on what they just created instead of hunting for it in the grid.
			jump(path, currentNumber + 1);
			return;
		}
		statusKind = 'ok';
		statusMsg = `Added ${path}`;
		pendingOpenPath = path;
	}

	function openPending() {
		if (!pendingOpenPath) return;
		const path = pendingOpenPath;
		pendingOpenPath = '';
		jump(path, currentNumber + 1);
	}

	async function confirmRemove(tilePath: string, tileTitle: string) {
		if (!$canEditDeck) {
			flashNotAllowed();
			return;
		}
		if (!deck) {
			statusKind = 'error';
			statusMsg = 'No deck name — cannot write pages.ts.';
			return;
		}
		const ok = browser
			? window.confirm(
					`Remove “${tileTitle}” (${tilePath}) from the deck?\n\n` +
						`This unlists it from pages.ts only — the slide folder stays on disk.`
				)
			: false;
		if (!ok) return;
		busy = true;
		statusKind = 'info';
		statusMsg = 'Removing…';
		const res = await removePage({ deck, path: tilePath });
		busy = false;
		if (res.error) {
			statusKind = 'error';
			statusMsg = res.error;
			return;
		}
		statusKind = 'ok';
		statusMsg = `Removed ${tilePath} from the deck — waiting for reload…`;
	}

	function jump(path: string, number: number) {
		// In EDIT mode a primary click still jumps — chrome (×, +) stops propagation.
		overviewOpen.set(false);
		overviewEditMode.set(false);
		showAddForm = false;
		const direction = currentNumber > 0 && number < currentNumber ? 'back' : 'forward';
		navigate(`./${path}`, { viewTransitions, kind: 'slide', direction });
	}

	// `o` opens the grid, Escape closes it (or steps out of form → edit → grid).
	// While open, `e` toggles EDIT deck mode (mnemonic on the EDIT button).
	function handleGlobalKeydown(event: KeyboardEvent) {
		// Layered Esc while the grid is open: form → leave EDIT → close.
		if (
			event.key === 'Escape' &&
			$overviewOpen &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey
		) {
			if (showAddForm) {
				event.preventDefault();
				cancelAddForm();
				return;
			}
			if ($overviewEditMode) {
				event.preventDefault();
				leaveEdit();
				return;
			}
		}
		// E = EDIT deck (only while the grid is open, never while typing in the add form).
		if (
			$overviewOpen &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.altKey &&
			!event.defaultPrevented &&
			(event.key === 'e' || event.key === 'E')
		) {
			const t = event.target as HTMLElement | null;
			const tag = t?.tagName ?? '';
			if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
			event.preventDefault();
			toggleEdit();
			return;
		}
		const intent = overviewPageKeyIntent(event, $overviewOpen);
		if (intent === 'ignore') return;
		event.preventDefault();
		if (intent === 'close') {
			close();
		} else {
			overviewOpen.set(true);
		}
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
		if (editFlashTimer) clearTimeout(editFlashTimer);
	});

	// Closing the grid always drops EDIT so the next open is browse mode.
	$: if (browser && !$overviewOpen) {
		overviewEditMode.set(false);
		showAddForm = false;
	}

	// The observer can only exist once the grid is in the DOM; tear it down on close
	// so a shut grid holds no callbacks.
	$: if (browser) {
		if ($overviewOpen && gridRef) startObserver();
		if (!$overviewOpen && observer) {
			observer.disconnect();
			observer = undefined;
		}
	}
</script>

<!-- OverviewPage has no button of its OWN — no third thing sitting in the corner competing with
     the ToC for the eye. It opens with `O` (the shortcut a speaker who wants slide 40 already
     reaches for) and, for the mouse, from the OVERVIEW item in ANNOTATE's tool flyout, which
     drives the same `overviewOpen` store. Esc (or a click outside) closes it. -->
{#if $overviewOpen}
	<!-- The scrim covers the whole canvas. Clicking it (but not the grid) closes,
	     the same "click outside dismisses" the ToC has. -->
	<div
		class="scrim no-print"
		class:editing={$overviewEditMode}
		role="presentation"
		on:click|self={close}
		style="--canvas-w:{width}px; --canvas-h:{height}px;"
	>
		<div class="head">
			<span class="head-title">{$overviewEditMode ? 'EDIT DECK' : 'OVERVIEW PAGE'}</span>
			<span class="head-count">{tiles.length} slides</span>
			{#if statusMsg || pendingOpenPath}
				<span class="head-status" class:err={statusKind === 'error'} class:ok={statusKind === 'ok'}>
					{statusMsg}
					{#if pendingOpenPath}
						<button
							type="button"
							class="status-open"
							on:click|stopPropagation={openPending}
						>Open</button>
					{/if}
				</span>
			{/if}
			<span class="head-actions">
				{#if $overviewEditMode}
					<button
						type="button"
						class="edit-btn add-head-btn"
						disabled={busy}
						on:click|stopPropagation={() => openAddForm('')}
						title="Add a slide at the end of the deck"
					>ADD</button>
				{/if}
				<button
					type="button"
					class="edit-btn"
					class:on={$overviewEditMode}
					class:flash={!!editFlash}
					on:click|stopPropagation={toggleEdit}
					title={editFlashTip || ($canEditDeck
						? ($overviewEditMode ? 'Leave edit mode (E)' : 'Add or remove slides (E)')
						: 'Edit deck only works in vite dev')}
					aria-pressed={$overviewEditMode}
					aria-keyshortcuts="e"
				>
					{editFlash || ($overviewEditMode ? 'DONE' : 'EDIT')}
					{#if !editFlash}
						<kbd class="edit-kbd">E</kbd>
					{/if}
				</button>
				<span class="head-hint">
					{#if $overviewEditMode}
						ADD · + between · × unlist · <kbd>E</kbd> done · <kbd>Esc</kbd>
					{:else}
						click a slide · <kbd>E</kbd> edit · <kbd>Esc</kbd> close
					{/if}
				</span>
			</span>
		</div>

		{#if showAddForm}
			<!-- svelte-ignore a11y_no_static_element_interactions — stopPropagation so
			     clicking the form does not close the scrim; keyboard path is Esc / buttons. -->
			<div class="add-form-wrap" on:click|stopPropagation on:keydown|stopPropagation>
			<form
				class="add-form"
				on:submit|preventDefault={submitAdd}
			>
				<div class="add-form-title">Add slide</div>
				<label>
					<span>Title</span>
					<input
						type="text"
						bind:value={addTitle}
						placeholder="My new slide"
						disabled={busy}
					/>
				</label>
				<label>
					<span>Path</span>
					<input
						type="text"
						value={addPath}
						on:input={(e) => {
							pathTouched = true;
							addPath = e.currentTarget.value;
						}}
						placeholder="my-new-slide.html"
						disabled={busy}
						spellcheck="false"
					/>
				</label>
				<label>
					<span>Template</span>
					<select bind:value={addTemplate} disabled={busy}>
						<option value="content">ContentPage</option>
						<option value="title">TitlePage</option>
					</select>
				</label>
				<label>
					<span>After</span>
					<select bind:value={addAfter} disabled={busy}>
						<option value="">(end of deck)</option>
						{#each tiles as t}
							<option value={t.path}>{t.number}. {t.title}</option>
						{/each}
					</select>
				</label>
				<label class="add-form-check">
					<input type="checkbox" bind:checked={openAfterAdd} disabled={busy} />
					<span>Open after adding</span>
				</label>
				<div class="add-form-actions">
					<button type="button" class="form-btn ghost" on:click={cancelAddForm} disabled={busy}>
						Cancel
					</button>
					<button type="submit" class="form-btn" disabled={busy}>Add</button>
				</div>
			</form>
			</div>
		{/if}

		<div class="grid" class:editing={$overviewEditMode} bind:this={gridRef}>
			{#each tiles as tile (tile.path)}
				<div class="tile-wrap">
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
						{#if $overviewEditMode}
							<span class="path-line">{tile.path}</span>
						{/if}
					</button>
					{#if $overviewEditMode}
						<button
							type="button"
							class="tile-remove"
							title="Remove from deck (unlist)"
							aria-label="Remove {tile.title} from deck"
							disabled={busy}
							on:click|stopPropagation={() => confirmRemove(tile.path, tile.title)}
						>
							×
						</button>
						<!-- Insert gutter: sits in the gap AFTER this tile (between pages). -->
						<button
							type="button"
							class="gutter-add"
							title="Add slide after this one"
							aria-label="Add slide after {tile.title}"
							disabled={busy}
							on:click|stopPropagation={() => openAddForm(tile.path)}
						>
							+
						</button>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
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
	.head-status {
		/* functional */
		font-size: 0.75em;
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
	}
	.head-status.err {
		color: #e74c3c;
	}
	.head-status.ok {
		color: var(--overview-page-current-border, #00B356);
	}
	.status-open {
		/* functional */
		cursor: pointer;
		margin-left: 0.5em;
		/* cosmetic */
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		color: #fff;
		background: var(--overview-page-tile-hover-border, #2980B9);
		border: none;
		border-radius: 3px;
		padding: 0.15em 0.55em;
	}
	.head-actions {
		/* functional */
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.85em;
	}
	.add-head-btn {
		/* cosmetic — primary action while editing */
		background: var(--overview-page-tile-hover-border, #2980B9);
		border-color: var(--overview-page-tile-hover-border, #2980B9);
		color: #fff;
	}
	.add-head-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.edit-kbd {
		/* functional */
		margin-left: 0.4em;
		/* cosmetic */
		font: inherit;
		font-size: 0.85em;
		font-weight: 600;
		opacity: 0.75;
		border: 1px solid currentColor;
		border-radius: 3px;
		padding: 0 0.3em;
		line-height: 1.25;
	}
	.edit-btn {
		/* functional */
		cursor: pointer;
		/* cosmetic */
		font: inherit;
		font-size: 0.75em;
		font-weight: bold;
		letter-spacing: 0.06em;
		color: var(--overview-page-head-fg, #E6EDF3);
		background: transparent;
		border: 1.5px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 4px;
		padding: 0.25em 0.7em;
	}
	.edit-btn:hover,
	.edit-btn:focus-visible {
		border-color: var(--overview-page-tile-hover-border, #2980B9);
	}
	.edit-btn.on {
		/* cosmetic */
		background: var(--overview-page-tile-hover-border, #2980B9);
		border-color: var(--overview-page-tile-hover-border, #2980B9);
		color: #fff;
	}
	.edit-btn.flash {
		/* cosmetic — same refusal language as ADJUST SAVE */
		background: #8B2E2E;
		border-color: #c0392b;
		color: #fff;
	}
	kbd {
		/* cosmetic */
		border: 1px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 3px;
		padding: 0 0.35em;
	}

	.add-form-wrap {
		/* functional */
		flex: none;
	}
	.add-form {
		/* functional */
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75em 1em;
		align-items: end;
		/* cosmetic */
		background: var(--overview-page-tile-bg, #14181D);
		border: 1.5px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 6px;
		padding: 1em 1.2em;
		color: var(--overview-page-head-fg, #E6EDF3);
		font-size: 0.85em;
	}
	.add-form-title {
		/* functional */
		grid-column: 1 / -1;
		/* cosmetic */
		font-weight: bold;
		letter-spacing: 0.06em;
		font-size: 0.95em;
	}
	.add-form label {
		/* functional */
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}
	.add-form label span {
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
		font-size: 0.85em;
	}
	.add-form input,
	.add-form select {
		/* functional */
		font: inherit;
		/* cosmetic */
		color: var(--overview-page-head-fg, #E6EDF3);
		background: #0C0F13;
		border: 1px solid var(--overview-page-tile-border, #2B3440);
		border-radius: 3px;
		padding: 0.35em 0.5em;
	}
	.add-form-check {
		/* functional */
		grid-column: 1 / -1;
		flex-direction: row !important;
		align-items: center;
		gap: 0.5em !important;
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
		font-size: 0.9em;
	}
	.add-form-check input {
		/* functional */
		width: 1em;
		height: 1em;
	}
	.add-form-actions {
		/* functional */
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: 0.6em;
	}
	.form-btn {
		/* functional */
		cursor: pointer;
		/* cosmetic */
		font: inherit;
		font-weight: bold;
		letter-spacing: 0.04em;
		color: #fff;
		background: var(--overview-page-tile-hover-border, #2980B9);
		border: none;
		border-radius: 4px;
		padding: 0.4em 1em;
	}
	.form-btn.ghost {
		/* cosmetic */
		background: transparent;
		color: var(--overview-page-dim-fg, #8A99A8);
		border: 1px solid var(--overview-page-tile-border, #2B3440);
	}
	.form-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
	/* Room on the right for the between-page + gutters that sit in the column gap. */
	.grid.editing {
		/* functional */
		column-gap: 1.8em;
		padding-right: 1.2em;
	}

	.tile-wrap {
		/* functional */
		position: relative;
		display: flex;
		flex-direction: column;
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
	.path-line {
		/* functional */
		font-size: 0.7em;
		/* cosmetic */
		color: var(--overview-page-dim-fg, #8A99A8);
		font-family: ui-monospace, monospace;
	}
	.tile.current .num,
	.tile.current .name {
		/* cosmetic */
		color: var(--overview-page-current-border, #00B356);
	}

	.tile-remove {
		/* functional */
		position: absolute;
		top: 0.35em;
		right: 0.35em;
		z-index: 2;
		cursor: pointer;
		/* cosmetic */
		width: 1.7em;
		height: 1.7em;
		border-radius: 4px;
		border: 1.5px solid var(--overview-page-tile-border, #2B3440);
		background: var(--overview-page-tile-bg, #14181D);
		color: var(--overview-page-head-fg, #E6EDF3);
		font: inherit;
		font-size: 1.1em;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}
	.tile-remove:hover {
		border-color: #c0392b;
		color: #e74c3c;
	}

	/* Between-page insert: a small + in the column gap after each tile. */
	.gutter-add {
		/* functional */
		position: absolute;
		/* Sit in the gap between this tile and the next (half outside the wrap). */
		right: -1.05em;
		top: 28%;
		z-index: 3;
		cursor: pointer;
		/* cosmetic */
		width: 1.5em;
		height: 1.5em;
		border-radius: 50%;
		border: 1.5px solid var(--overview-page-tile-border, #2B3440);
		background: var(--overview-page-tile-bg, #14181D);
		color: var(--overview-page-dim-fg, #8A99A8);
		font: inherit;
		font-size: 1em;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		opacity: 0.55;
		transition: opacity 120ms ease, border-color 120ms ease, color 120ms ease;
	}
	.tile-wrap:hover .gutter-add,
	.gutter-add:hover,
	.gutter-add:focus-visible {
		opacity: 1;
		border-color: var(--overview-page-tile-hover-border, #2980B9);
		color: var(--overview-page-tile-hover-border, #2980B9);
	}
	.gutter-add:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
