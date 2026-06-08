<!--
  Example: Hint component
  File: src/routes/slides/hint-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="Hint" subtitle="A subtle prompt pinned to the bottom of a slide">
	<div style="font-size: 0.8em;">
		<p>
			<b>Hint</b> shows faint, bold text at the bottom of the slide &mdash; handy for
			cues like &ldquo;click to expand&rdquo; or &ldquo;scroll right&rdquo;.
			Look at the bottom of this slide. &darr;
		</p>
		<div style="font-family: monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; margin-top: 0.5em;">
			&lt;Hint text="Look below &mdash; this is a hint" /&gt;
		</div>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			Props: <code>text</code>, <code>isVisible</code> (default <code>true</code>).
		</p>
	</div>
</ContentPage>

<Hint text="Look below — this is a hint" />
