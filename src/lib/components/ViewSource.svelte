<!--
  ViewSource — a "show me the source" control for a slide (or Text).

  Drop it on a page to offer that page's own source in a CodeBox, titled with its
  file path. The deck is the documentation, so this lets a viewer read exactly
  the text that produced the slide they're on.

  On a presentation slide the trigger lives in the top tool bar's ☰ menu as
  SOURCE (next to OVERVIEW / CAPTURE / PRINT) — this component registers the
  source with the deck and renders the panel; it no longer places a corner
  button. On a Text (no tool bar) the classic corner "</> Source" button is kept
  as the open control.

  Usage (per page — the ?raw import and path can't be auto-derived here, so each
  page passes its own):

    <script>
      import ViewSource from '$lib/components/ViewSource.svelte';
      import source     from './+page.svelte?raw';   // Vite hands back the file's bytes
    </script>

    <ViewSource {source} path="src/routes/slides/title.html/+page.svelte" />

  Monaco has no native `svelte` mode, so the source is highlighted as `html`
  (the closest built-in); the displayed text itself is exact.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CtrlBtn from '$lib/components/CtrlBtn.svelte';
	import CodeBox from '$lib/components/CodeBox.svelte';
	import { getMode } from '$lib/presentation';
	import {
		registerPageSource,
		unregisterPageSource,
		pageSourceOpen
	} from '$lib/stores/pageSource';

	/** The page source, typically `import source from './+page.svelte?raw'`. */
	export let source: string;
	/** The path shown in the CodeBox title bar. */
	export let path: string = '';
	/** Monaco language for highlighting. Svelte files read best as `html`. */
	export let language: string = 'html';
	/** Button label (Text-mode corner control only). */
	export let text: string = '</> Source';
	/** Recede into the frame like the other chrome controls (MODE / nav). Default
	    on; pass `chrome={false}` for the prominent accent-blue look. */
	export let chrome: boolean = true;
	/** Inline style for the root element, applied last so it wins. */
	export let style: string = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. NOTE: a slide's own style block is scoped, so a
	    class defined there will NOT match — use global CSS (global.css / roles.css / a
	    :global(...) block) or a utility class. See AGENTS.md. */
	let klass: string = '';
	export { klass as class };

	// Presentations host the trigger in the tool bar's ☰; Texts keep the corner button.
	const cornerButton = getMode() === 'text';

	let expanded = false;

	// Keep the panel and the shared store in step: the hamburger opens via the store;
	// CodeBox closes via bind:expanded. Either direction must update the other.
	const unsubOpen = pageSourceOpen.subscribe((v) => {
		if (expanded !== v) expanded = v;
	});
	$: if (expanded !== $pageSourceOpen) pageSourceOpen.set(expanded);
	onDestroy(unsubOpen);

	onMount(() => {
		const owner = Symbol('view-source');
		registerPageSource(owner);
		return () => unregisterPageSource(owner);
	});
</script>

<!-- `gp-chrome` enrols this in the deck's fadeChrome behaviour with the nav bar and
     the ToC; `expanded` pins it lit while its own CodeBox is up. On a presentation
     the corner button is gone (SOURCE is in the ☰ menu) but the wrapper stays so
     style/id/class still land on a root element. -->
<div class="view-source gp-chrome {klass}" class:expanded class:corner={cornerButton} id={id || undefined} style={style || undefined}>
	{#if cornerButton}
		<CtrlBtn {chrome} {text} hoverText="View source" isSelected={expanded} on:click={() => (expanded = true)} />
	{/if}
</div>

<!-- The panel is a SIBLING of the button, so it needs the chrome markers in its own right —
     the button's do not reach it. Unmarked, it is not merely an eyesore in a printout: a closed
     CodeBox still mounts Monaco, whose internal scroll surface lays out tens of thousands of
     pixels wide, and Chrome SHRINKS A PRINTED PAGE to fit its widest content. One un-marked
     panel therefore printed every slide in the deck at three-quarter size. -->
<CodeBox code={source} {language} title={path} bind:expanded class="gp-chrome no-print" />

<style>
	/* Bottom-right corner — only used on a Text, where there is no tool-bar ☰.
	   On a presentation the wrapper is a zero-size host for style/id/class. */
	.view-source.corner {
		position: absolute;
		bottom: 0px;
		right: 5px;
	}
</style>
