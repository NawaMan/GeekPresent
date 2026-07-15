<!--
  SourceView — the Monaco-free "</> Source" control.

  Use this INSTEAD OF ViewSource on any slide reached by a CLIENT-SIDE navigation:
  a View-Transition deck (setViewTransitions), or an AppendixPage/AppendixLink with
  `transition`. ViewSource pops a Monaco CodeBox, and Monaco's CDN AMD loader does
  not re-initialise across a `goto`, so it renders blank on every slide after the
  first one. (See the project memory "monaco-breaks-on-spa-nav".) Everything else —
  a deck that pages with full loads — can keep using ViewSource.

  Same control, same corner, same Box: only the highlighter differs. Shiki is plain
  ESM behind a shared singleton highlighter ($lib/utils/highlight), so it survives
  navigation. Highlighting is lazy — done the first time the viewer is opened, with
  the plain source showing until (and if) it resolves.

  Each page passes its own source via Vite's ?raw import; the file path shown in the
  title bar is derived from the current route unless `path` overrides it.

    <script>
      import SourceView from '$lib/components/SourceView.svelte';
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
	/** Recede into the frame like the other chrome controls. Default on. */
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

<div class="view-source no-print {klass}" id={id || undefined} style={style || undefined}>
	<CtrlBtn {chrome} text="</> Source" hoverText="View this slide's source" isSelected={expanded} on:click={() => (expanded = true)} />
</div>

<!-- The panel is a SIBLING of the button, so it carries the print marker in its own right; the
     button's `no-print` does not reach it. (ViewSource has the same shape, and there it is
     load-bearing — see the note there.) -->
<Box bind:expanded width={1500} height={975} scrollable class="gp-chrome no-print">
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
