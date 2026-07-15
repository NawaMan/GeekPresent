<!--
  Example: Note-driven highlight (Spotlight)

  File: src/routes/slides/note-highlight-component.html/+page.svelte

  A <Note> line carrying `data-highlight="db"` spotlights the Block named "db" as
  the speaker covers it in the presenter console — a laser pointer the audience
  sees, drawn on the live slide and tracking the box even in ADJUST mode. The
  spotlight is a canvas-level singleton SlideDeck mounts for you; nothing is placed
  on the slide but the named Blocks.

  TWO ways to see it:
    - In THIS window, hover the tinted buttons below — they call `setHighlight`
      directly, so a slide can drive the cue with no presenter at all.
    - Open PRESENT (top-right), then hover the highlighted lines in the console's
      notes panel — the box lights on THIS (audience) window over the localStorage
      relay, exactly as it will on a projector.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Connector   from '$lib/components/Connector.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Note        from '$lib/components/Note.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import { setHighlight } from '$lib/stores/highlightTarget';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/note-highlight-component.html/+page.svelte';

	// The buttons below drive the spotlight directly — the same primitive a Note line
	// relays to. Hover to light, leave to clear, so it reads like the note-line cue.
	const boxes = ['browser', 'edge', 'api', 'cache', 'db'];
</script>

<ContentPage title="Note-driven Highlight" subtitle="A note line spotlights a named Block as you cover it">
	<div style="max-width: 720px;">
		<p>
			Give a note line a <code>data-highlight</code> that names an on-slide
			<b>Block</b>. As the speaker covers that line in the presenter console, the
			named box lights up on the audience slide — a laser pointer drawn in canvas
			space, so it tracks the box even in ADJUST mode.
		</p>

		<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Block name="db" …>DB</Block>

<Note>
  <li data-highlight="db">Now the query hits the database</li>
</Note>`} />

		<p style="margin-top: 0.6em;">
			Try it here — hover a button to spotlight that box (they call
			<code>setHighlight</code> directly, the same primitive a note line relays):
		</p>
		<div class="btns">
			{#each boxes as b}
				<button
					type="button"
					on:pointerenter={() => setHighlight(b)}
					on:pointerleave={() => setHighlight(null)}
					on:focus={() => setHighlight(b)}
					on:blur={() => setHighlight(null)}
				>{b}</button>
			{/each}
		</div>
	</div>
</ContentPage>

<!-- The boxes. Their names are all the note lines / buttons above know about them. -->
<Block name="browser" x={1020} y={300} width={220} height={110} grid={10}>
	<div class="node">Browser</div>
</Block>
<Block name="edge" x={1360} y={300} width={220} height={110} grid={10}>
	<div class="node">Edge</div>
</Block>
<Block name="api" x={1700} y={300} width={200} height={110} grid={10}>
	<div class="node">API</div>
</Block>
<Block name="cache" x={1160} y={620} width={220} height={110} grid={10}>
	<div class="node">Cache</div>
</Block>
<Block name="db" x={1600} y={620} width={220} height={110} grid={10}>
	<div class="node">DB</div>
</Block>

<!-- Connectors come AFTER the boxes they link (they resolve names at prerender). -->
<Connector from="browser" to="edge" label="GET" />
<Connector from="edge" to="api" label="route" />
<Connector from="api" to="db" route="ortho" radius={16} label="query" labelOffset={26} />
<Connector from="api" to="cache" route="curve" label="read" labelOffset={-30} />

<!-- The speaker's notes. Each line names the box it talks about; hover it in the
     console (PRESENT) to light that box on the audience slide. -->
<Note>
	<li data-highlight="browser">The <b>browser</b> makes a GET request.</li>
	<li data-highlight="edge">It lands first at the <b>edge</b> / CDN.</li>
	<li data-highlight="api">A miss is routed on to the <b>API</b>.</li>
	<li data-highlight="cache">The API checks the <b>cache</b> first…</li>
	<li data-highlight="db">…and only then hits the <b>database</b>.</li>
</Note>

<Hint text="Hover a button — or open PRESENT and hover a note line — to spotlight a box" />
<ViewSource {source} {path} />

<style>
	.node {
		display: grid;
		place-items: center;
		box-sizing: border-box;
		border: 2px solid var(--surface-fg, #C0F1FF);
		border-radius: 10px;
		background: var(--surface-bg, #181818);
		font-size: 0.9em;
		font-weight: bold;
	}
	.btns {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 0.5em;
	}
	.btns button {
		font: inherit;
		font-size: 0.8em;
		padding: 6px 16px;
		color: var(--spotlight-ring, #F0A33E);
		background: color-mix(in srgb, var(--spotlight-ring, #F0A33E) 12%, transparent);
		border: 1.5px solid color-mix(in srgb, var(--spotlight-ring, #F0A33E) 55%, transparent);
		border-radius: 8px;
		cursor: pointer;
	}
	.btns button:hover,
	.btns button:focus-visible {
		background: color-mix(in srgb, var(--spotlight-ring, #F0A33E) 24%, transparent);
		outline: none;
	}
</style>
