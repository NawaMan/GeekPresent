<!--
  Example: ViewSource — SOURCE views in-slide; EDIT opens an unscaled popup.
  File: src/routes/slides/viewsource-edit.html/+page.svelte

  Sibling of ADJUST's SAVE: write-back lives in `/_source-edit` (no canvas scale),
  so Monaco's caret matches the glyphs. SOURCE keeps the classic CodeBox panel.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/viewsource-edit.html/+page.svelte';
</script>

<ContentPage title="ViewSource — Edit in Dev" subtitle="SOURCE to view · EDIT to type in a separate window">
	<div style="line-height: 1.5em;">
		<p>
			Drop <Label>ViewSource</Label> on a page. The top tool bar's
			<b>☰ → SOURCE</b> opens this page's own file in a Monaco <b>CodeBox</b>
			(via Vite's <code>?raw</code> import &mdash; it can never drift from the real file).
		</p>
		<p style="margin-top: 0.55em;">
			Typing does <b>not</b> happen on the slide. The canvas is CSS-scaled, and Monaco's
			caret does not follow that scale. Use <b>☰ → EDIT</b>, or the <b>EDIT</b> button on
			the CodeBox title bar, to open <code>/_source-edit</code> in a separate window
			(1:1 layout). That window has <b>SAVE</b> and <b>CLOSE</b>; SAVE never closes it.
		</p>
		<QuickCode style="margin-top: 0.55em;" lang="svelte" code={`import ViewSource from '$lib/components/ViewSource.svelte';
import source     from './+page.svelte?raw';

<ViewSource {source} path="src/routes/slides/…/+page.svelte" />`} />
	</div>
</ContentPage>

<Block name="demo-line" x={67} y={791} width={1000} height={140}>
	<div class="demo-line">
		<p class="cue-label">Demo line (edit me via ☰ → EDIT)</p>
		<p class="cue-text">Hello from ViewSource SAVE — change this text and hit SAVE.</p>
	</div>
</Block>

<Block name="how" x={1085} y={475} width={811} height={290}>
	<Callout kind="tip" title="Try it now">
		<p>1. <b>☰ → SOURCE</b> — view the file in the CodeBox.</p>
		<p style="margin-top: -0.5em;">2. Click <b>EDIT</b> on the CodeBox (or ☰ → EDIT).</p>
		<p style="margin-top: -0.5em;">3. Edit in the popup; <b>SAVE</b> (window stays open).</p>
		<p style="margin-top: -0.5em;">4. After ADJUST SAVE, hit <b>REFRESH</b> to pull disk (warns if dirty).</p>
		<p style="margin-top: -0.5em;">5. <b>CLOSE</b> the popup when done.</p>
	</Callout>
</Block>

<Block name="boundary" x={1086} y={795} width={824} height={171}>
	<Callout kind="warn" title="Built site">
		<p>
			SAVE only writes under <code>vite dev</code>. On a static host EDIT still opens
			the window (read-only) and SAVE answers <span class="forbidden">NOT ALLOWED</span>.
		</p>
	</Callout>
</Block>

<Hint text="☰ → SOURCE to view · EDIT (menu or CodeBox) for the unscaled editor · SAVE · CLOSE" style="font-size:1.1em" />

<ViewSource {source} {path} />

<style>
	.demo-line {
		height: 100%;
		box-sizing: border-box;
		padding: 0.7em 1em;
		border-radius: 10px;
		background: rgba(127, 217, 255, 0.08);
		border: 2px dashed rgba(127, 217, 255, 0.45);
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.35em;
	}
	.cue-label {
		margin: 0;
		font-size: 0.75em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		opacity: 0.7;
	}
	.cue-text {
		margin: 0;
		font-size: 1.15em;
		font-weight: bold;
		color: var(--surface-fg, #C0F1FF);
	}
	.forbidden {
		color: var(--ctrl-forbidden-fg, #E5484D);
		font-weight: bold;
	}
</style>
