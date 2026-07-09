<!--
  Example: Callout component
  File: src/routes/slides/callout-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Label       from '$lib/components/Label.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/callout-component.html/+page.svelte';
</script>

<ContentPage title="Callout" subtitle="Semantic admonition boxes — info, tip, warn, danger">
	<div style="max-width: 720px;">
		<p>
			<b>Callout</b> flags a passage by intent. Each <code>kind</code> carries its
			own accent, icon and default title, all themed from <code>roles.css</code>.
		</p>

		<QuickCode style="margin-top: 0.6em;">
			&lt;Callout kind="warn" title="Gotcha"&gt;<br/>
			&nbsp;&nbsp;Client-side nav blanks Monaco.<br/>
			&lt;/Callout&gt;
		</QuickCode>

		<p style="margin-top: 0.7em; opacity: 0.8;">
			Props: <code>kind</code>, <code>title</code> (omit for the default,
			<code>""</code> to hide), <code>icon</code>, <code>style</code>.
		</p>
	</div>
</ContentPage>

<!-- The four kinds, each wrapped in a Block so the author can place/resize them in
     LAYOUT mode (readers just see them fixed). Block fills its content, so the
     callout stretches to whatever shape you drag the box into. -->
<Block name="info"   x={820}  y={250} width={520} height={170} grid={10}>
	<Callout kind="info">
		The four kinds are <b>info</b>, <b>tip</b>, <b>warn</b> and <b>danger</b>.
	</Callout>
</Block>
<Block name="tip"    x={1360} y={250} width={520} height={170} grid={10}>
	<Callout kind="tip" title="Pro tip">
		Give a custom <code>title</code> to override the default label.
	</Callout>
</Block>
<Block name="warn"   x={820}  y={450} width={520} height={170} grid={10}>
	<Callout kind="warn" title="Gotcha">
		Monaco blanks after client-side nav — use <code>CssSnippet</code> in SPA decks.
	</Callout>
</Block>
<Block name="danger" x={1360} y={450} width={520} height={170} grid={10}>
	<Callout kind="danger">
		Never commit secrets — <code>.gitignore</code> can be stripped by tooling.
	</Callout>
</Block>

<Hint text="Flip LAYOUT (top-right) to drag & resize any callout" />

<ViewSource {source} {path} />
