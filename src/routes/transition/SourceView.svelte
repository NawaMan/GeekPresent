<!--
  SourceView — a Monaco-free "</> Source" control for this deck.

  Pops the page source into a Box, syntax-highlighted by Shiki (svelte grammar) —
  not a Monaco CodeBox, whose CDN AMD loader does not re-initialise across this
  deck's client-side (goto) navigations and so renders blank on the second slide
  onward. See the project memory "monaco-breaks-on-spa-nav". Shiki is plain ESM via
  a shared singleton highlighter ($lib/utils/highlight), so it survives navigation.
  Highlighting is lazy — done the first time the viewer is opened.

  Each page passes its own source via Vite's ?raw import; the file path shown in the
  title bar is derived from the current route.

    <script>
      import SourceView from '../SourceView.svelte';
      import source     from './+page.svelte?raw';
    </script>
    <SourceView {source} />
-->
<script lang="ts">
	import CtrlBtn from '$lib/components/CtrlBtn.svelte';
	import Box     from '$lib/components/Box.svelte';
	import { page } from '$app/stores';
	import { highlightToHtml } from '$lib/utils/highlight';

	/** The page source, typically `import source from './+page.svelte?raw'`. */
	export let source: string;
	/** Override the auto-derived path shown in the title bar. */
	export let path: string = '';

	let expanded = false;
	let html = '';
	let requested = false;

	$: filePath = path || `src/routes${$page.route.id}/+page.svelte`;

	// Highlight lazily the first time the viewer is opened; plain source shows until
	// (and if) it resolves.
	$: if (expanded && !requested) {
		requested = true;
		highlightToHtml(source, 'svelte').then((out) => (html = out)).catch(() => {});
	}
</script>

<div class="view-source no-print">
	<CtrlBtn text="</> Source" hoverText="View this slide's source" isSelected={expanded} on:click={() => (expanded = true)} />
</div>

<Box bind:expanded width={1500} height={975} scrollable>
	<div class="src">
		<div class="src-title">{filePath}</div>
		{#if html}
			{@html html}
		{:else}
			<pre class="src-code"><code>{source}</code></pre>
		{/if}
	</div>
</Box>

<style>
	/* Bottom-right corner — matches the framework's ViewSource placement. */
	.view-source {
		position: absolute;
		bottom: 0px;
		right: 5px;
	}

	.src { width: 1500px; }
	.src-title {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 0.7em 1.1em;
		font-family: 'Fira Code', monospace;
		font-weight: bold;
		font-size: 18px;
		color: var(--code-title-fg, #FFFFFF);
		background: var(--code-title-bg, #1E1E1E);
		border-bottom: 1.5px solid var(--code-title-border, #333333);
	}
	.src-code {
		margin: 0;
		padding: 1.1em 1.3em;
		overflow-x: auto;
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		line-height: 1.6;
		color: var(--surface-fg, #C7F5D4);
		white-space: pre;
	}
	.src-code code { font-family: inherit; }

	/* Shiki output: keep token colours, drop its background, match our sizing. */
	.src :global(pre.shiki) {
		margin: 0;
		padding: 1.1em 1.3em;
		overflow-x: auto;
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		line-height: 1.6;
		white-space: pre;
		background-color: transparent !important;
	}
	.src :global(pre.shiki code) { font-family: inherit; }
</style>
