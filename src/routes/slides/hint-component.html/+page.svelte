<!--
  Example: Hint component
  File: src/routes/slides/hint-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="Hint" subtitle="A subtle prompt pinned to the bottom of a slide">
	<p>
		<b>Hint</b> shows faint, bold text at the bottom of the slide &mdash; handy for
		cues like &ldquo;click to expand&rdquo; or &ldquo;scroll right&rdquo;.
		Look at the bottom of this slide. &darr;
	</p>
	<QuickCode style="margin-top: 0.5em;" lang="svelte" code={`<Hint text="Look below — this is a hint" />`} />
	<p style="margin-top: 0.6em; opacity: 0.8;">
		It rests semi-transparent and sharpens when you point at it &mdash; hover the
		hint below &mdash; and carries an <b>(X)</b> to dismiss it once read. Set
		<code>dim</code> for a fainter rest, <code>dismissible=&#123;false&#125;</code> to drop the (X).
	</p>
	<p style="margin-top: 0.6em; opacity: 0.8;">
		Props: <code>text</code>, <code>isVisible</code>, <code>boxed</code>,
		<code>dim</code> (resting opacity), <code>dismissible</code> (default
		<code>true</code>); fires <code>close</code> when dismissed.
	</p>
</ContentPage>

<Hint text="Look below — this is a hint" />
