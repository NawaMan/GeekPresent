<!--
  Example: ADJUST mode itself — the authoring workflow, demonstrated live.
  File: src/routes/slides/adjust-mode.html/+page.svelte

  This slide is the demo for the per-slide `adjust` flag: its pages.ts entry carries
  `adjust: true`, so the ADJUST toggle is offered in the BUILD, not just under
  `vite dev`. It lives inside the PRESENT menu (top-centre), not a corner button — open
  the menu and it is there. So the slide can talk about the toggle while it is one hover
  away, and the boxes below really drag in the deployed deck — including the part that
  is refused.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/adjust-mode.html/+page.svelte';
</script>

<ContentPage title="ADJUST Mode" subtitle="Place blocks by hand — and see where the loop stops">
	<div style="line-height: 1.5em;">
		<p>
			<b>ADJUST</b> is an <i>authoring</i> aid: flip it on and every
			<Label>Block</Label> grows drag and resize handles, so you position things by
			eye at exact canvas pixels instead of guessing numbers. Open the <b>PRESENT</b>
			menu, top-centre &mdash; <b>ADJUST</b> is in there, offered because this slide
			asked for it.
		</p>
		<p style="margin-top: 0.6em;">
			A published deck ships <i>without</i> it. A slide that teaches ADJUST opts back
			in on its own, with one flag in <code>pages.ts</code> &mdash; so the button is
			there when the audience is told to look for it, and nowhere else. It makes the
			control <i>available</i>, not <i>active</i>: the mode still starts off.
		</p>
		<QuickCode style="margin-top: 0.6em;" lang="ts" code={`{ path: "adjust-mode.html", title: "ADJUST Mode", adjust: true },`} />
		<p style="margin-top: 0.6em; opacity: 0.85;">
			<code>vite dev</code> offers ADJUST everywhere regardless, and
			<code>?adjust</code> on any slide URL opts a built site in by hand (sticky;
			<code>?adjust=off</code> clears it, and outranks the flag above). Drag, resize,
			<b>⤒</b>/<b>⤓</b> to restack, <b>Esc</b> to cancel, <b>Ctrl+Z</b> to undo, <b>Ctrl+S</b> to SAVE &mdash;
			all of it works here, and <b>Copy</b> hands back the updated tag.
		</p>
	</div>
</ContentPage>

<!-- The point of the slide: two Blocks that really are draggable in the deployed
     build, so the audience watches the workflow rather than a screenshot of it. -->
<Block name="drag-me" x={110} y={850} width={400} height={120} grid={10}>
	<div class="demo a"><b>Drag me</b><br/>snaps to 10px</div>
</Block>

<Block name="resize-me" x={610} y={850} width={460} height={120} grid={10}>
	<div class="demo b"><b>Resize me</b><br/>then hit Copy</div>
</Block>

<!-- The honest boundary, stated on the slide because it's the interesting half. SAVE
     rewrites the slide's .svelte file through an endpoint that only exists inside the
     vite dev server; a static host has no source tree to rewrite. The button is NOT
     greyed out here — it looks ordinary and refuses when pressed, which is the beat
     the demo is built around: press it and watch it say why. -->
<Block name="save-note" x={1115} y={790} width={720} height={190}>
	<div class="demo c">
		<p><b>SAVE</b> writes the tag straight back into the <code>.svelte</code> file.</p>
		<p style="margin-top: 0.35em;">
			It runs through the <b>vite dev server</b>. This deck is static &mdash; no source
			tree behind it &mdash; so press SAVE and it answers
			<span class="forbidden">NOT ALLOWED</span>. <b>Copy</b> is the way back.
		</p>
	</div>
</Block>

<Hint text="Open the PRESENT menu (top-centre), flip ADJUST, drag a box — then press SAVE and see what it says" />

<ViewSource {source} {path} />

<style>
	.demo {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		font-size: 1.4em;
		line-height: 1.4;
	}
	.demo.a {
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.demo.b {
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	/* The SAVE explainer reads as a note, not a toy — quieter fill, text left-aligned
	   and sized down, since it's a paragraph rather than a label. */
	.demo.c {
		background: #2a2118;
		border: 2px solid #d98a2b;
		color: #f3e3cf;
		align-items: flex-start;
		text-align: left;
		font-size: 0.95em;
		padding: 0 1.1em;
	}
	/* Both of these reuse the chrome's OWN role tokens, so the words on the slide and
	   the buttons they describe are literally the same colour — the audience matches
	   them without being told to. */
	.forbidden {
		color: var(--ctrl-forbidden-fg, #E5484D);
		font-weight: bold;
		white-space: nowrap;
	}
</style>
