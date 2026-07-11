<!--
  Example: Columns / Column components
  File: src/routes/slides/columns-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Columns     from '$lib/components/Columns.svelte';
	import Column      from '$lib/components/Column.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/columns-component.html/+page.svelte';
</script>

<ContentPage title="Columns" subtitle="Two- and three-column layouts — and the media/text split">
	<div style="max-width: 1180px;">
		<p>
			<b>Columns</b> is a thin CSS grid; <b>Column</b> is one cell of it. A
			<i>split</i> is not a second component — it is a <code>Columns</code> with
			unequal tracks, so <code>widths</code> is the only prop that tells them apart.
		</p>
	</div>
</ContentPage>

<!-- Three even columns with gutter rules. Parked in a Block so LAYOUT mode can move
     and resize the band; Block fills its content, so the grid stretches to the box. -->
<Block name="trio" x={60} y={400} width={1800} height={220} grid={10}>
	<Columns columns={3} divider gap="3em">
		<Column>
			<b>columns</b>
			<p>An even count. Every track is <code>minmax(0, 1fr)</code>, never a bare
			<code>1fr</code> — so a long URL wraps instead of widening its column.</p>
		</Column>
		<Column>
			<b>widths</b>
			<p>The ratio. <code>{'{[3, 2]}'}</code> is a 3:2 split;
			<code>{"{['360px', 1]}"}</code> is a fixed rail beside a fluid column.</p>
		</Column>
		<Column>
			<b>divider</b>
			<p>A hairline in each gutter, drawn as the column's own leading edge — so it
			never strays to the outer edges of the grid.</p>
		</Column>
	</Columns>
</Block>

<!-- The split: unequal tracks, vertically centred, so the prose sits level with the
     snippet beside it however tall either grows. `resizable` puts a grabbable divider
     in the gutter — drag it live, or focus it and use ←/→. -->
<Block name="split" x={60} y={670} width={1800} height={300} grid={10}>
	<Columns widths={[2, 3]} align="center" divider resizable gap="3em">
		<Column>
			<QuickCode lang="svelte" code={`<Columns widths={[2, 3]} align="center" divider resizable>
  <Column>…</Column>
  <Column span={2}>…</Column>
</Columns>`} />
		</Column>
		<Column>
			<p>
				<code>align</code> puts the columns on one baseline —
				<code>center</code> here, so the paragraph rides level with the snippet
				whatever either's height. A <code>Column</code> can override it for
				itself.
			</p>
			<p style="margin-top: 0.6em;">
				<b>Drag the divider</b> between these two. <code>resizable</code> makes it
				grabbable for a viewer; LAYOUT mode does so regardless, and adds a
				<code>widths</code> chip that copies the ratio you dragged. Double-click
				resets it. Nothing is saved — a slide is a page load.
			</p>
		</Column>
	</Columns>
</Block>

<Hint text="Drag the divider in the lower band — or flip LAYOUT to place & copy the ratio" />

<ViewSource {source} {path} />
