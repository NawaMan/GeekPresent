<!--
  Example: Label component
  File: src/routes/slides/label-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label       from '$lib/components/Label.svelte';

	let hovered = false;
</script>

<ContentPage title="Label" subtitle="Hoverable highlighted inline text">
	<div style="font-size: 0.8em; line-height: 1.7em;">
		<p>
			Wrap any inline term in a <Label>Label</Label> to highlight it.
			Hover over <Label bind:isHovered={hovered}>this term</Label> &mdash; the cursor
			becomes a help pointer{#if hovered} <b>&mdash; hovering now!</b>{/if}.
		</p>
		<div style="font-family: monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; margin-top: 0.5em;">
			&lt;Label&gt;important term&lt;/Label&gt;
		</div>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Props: <code>style</code>, <code>isHovered</code> (bindable). Dispatches
			<code>mouseover</code> / <code>mouseout</code> events.
		</p>
	</div>
</ContentPage>
