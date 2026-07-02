<!--
  Step 1b — a Shape is an editable SVG object inside Draw.
  File: src/routes/animation-check/shape-edit.html/+page.svelte

  A <Rect> (box-shaped, so Draw hosts a real Block for it — move/resize just
  like a Block) and a <Line> (endpoint handles). Same LAYOUT gate as a Block;
  Copy emits the shape's own tag.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Draw, Rect, Line } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/shape-edit.html/+page.svelte';
</script>

<ContentPage title="Shape — editable" subtitle="An SVG object inside Draw — same LAYOUT gate, same Copy.">
	<p class="hint">
		Shapes &mdash; <Label>Rect</Label>, <Label>Line</Label>, <Label>Curve</Label>,
		<Label>Ellipse</Label>, … &mdash; live inside a <Label>Draw</Label> surface (one
		full-canvas SVG in the very same coordinates as a Block). In <b>LAYOUT</b>, a box
		shape like <b>Rect</b> gives you the same move / resize handles as a Block; a line
		gives you endpoint handles. <b>Copy</b> emits the shape's own tag.
	</p>
</ContentPage>

<Draw
	title="An editable rounded rectangle and a line"
	name="shape-edit"
	description="A rounded Rect and a straight Line drawn on one Draw surface; in LAYOUT mode each is draggable and copyable."
>
	<Rect name="frame" x={710} y={460} width={500} height={210} rounded={16} color="#4aa3f0" thickness={4} />
	<Line name="rule" from={[720, 760]} to={[1200, 760]} color="#f39c12" thickness={6} />
</Draw>

<ViewSource {source} {path} />

<style>
	.hint {
		line-height: 1.4em;
	}
</style>
