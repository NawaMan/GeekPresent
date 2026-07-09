<!--
  Example: Connector component
  File: src/routes/slides/connector-component.html/+page.svelte

  Every arrow on this slide is authored by NAME — not one coordinate appears in
  a Connector tag. Flip LAYOUT mode on and drag any box: the arrows re-route to
  follow it. That is the whole point of the component.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Connector   from '$lib/components/Connector.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/connector-component.html/+page.svelte';
</script>

<ContentPage title="Connector" subtitle="Auto-routed arrows between named Blocks">
	<div style="max-width: 700px;">
		<p>
			Give a <b>Block</b> a <code>name</code> and it publishes its box. A
			<b>Connector</b> looks two of them up and routes an arrow between them —
			so a diagram is written in <i>names</i>, and the arrows follow the boxes
			when you drag them in LAYOUT mode.
		</p>

		<QuickCode style="margin-top: 0.6em;">
			&lt;Block name="api" …&gt;API&lt;/Block&gt;<br/>
			&lt;Block name="db"  …&gt;DB&lt;/Block&gt;<br/>
			<br/>
			&lt;Connector from="api" to="db" label="query" /&gt;
		</QuickCode>

		<p style="margin-top: 0.7em;">
			<code>route</code> picks the shape: <code>straight</code> attaches wherever
			the line meets each border, <code>ortho</code> turns right angles, and
			<code>curve</code> leaves each box square to its side. Sides are chosen
			automatically — pin one with <code>fromSide</code> / <code>toSide</code>.
		</p>
	</div>
</ContentPage>

<!-- The boxes. Names are the only thing the arrows below know about them. -->
<Block name="browser" x={960}  y={250} width={240} height={110} grid={10}>
	<div class="node">Browser</div>
</Block>
<Block name="edge"    x={1310} y={250} width={240} height={110} grid={10}>
	<div class="node">Edge</div>
</Block>
<Block name="api"     x={1660} y={250} width={240} height={110} grid={10}>
	<div class="node">API</div>
</Block>
<Block name="cache"   x={960}  y={580} width={240} height={110} grid={10}>
	<div class="node">Cache</div>
</Block>
<Block name="db"      x={1560} y={580} width={240} height={110} grid={10}>
	<div class="node">DB</div>
</Block>

<!-- ...and the arrows. Coordinate-free: drag any box above and watch these
     re-route. Each connector demonstrates one route. -->
<Connector from="browser" to="edge" label="GET" />
<Connector from="edge"    to="api"  label="route" />
<Connector from="api"     to="db"   route="ortho" radius={16} label="query" labelOffset={26} />
<Connector from="db"      to="cache" label="warm" dash />
<Connector
	from="cache"
	to="browser"
	route="curve"
	fromSide="left"
	toSide="left"
	label="hit"
	labelOffset={-40}
	color="var(--callout-tip-accent, #00B356)"
/>

<!-- Sits under the diagram it's warning about. Unnamed, so it adds no anchor. -->
<Block x={890} y={760} width={1010} height={150} grid={10}>
	<Callout kind="warn" title="Order matters" style="font-size: 0.8em;">
		A Connector resolves its names while the slide is <i>prerendered</i>, and Blocks
		register in document order — so put connectors <b>after</b> the boxes they link.
	</Callout>
</Block>

<Hint text="Flip LAYOUT (top-right) and drag a box — every arrow follows it" />
<ViewSource {source} {path} />

<style>
	/* Block fills its content, so the node stretches to whatever shape the box
	   is dragged into. */
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
</style>
