<!--
  Example: Available components overview
  File: src/routes/slides/components.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Components" subtitle="Reusable building blocks">
	<div style="font-size: 0.75em; line-height: 1.8em;">
		<b>Templates</b><br/>
		&bull; <b>TitlePage</b> &mdash; title / subtitle / subsubtitle slots<br/>
		&bull; <b>ContentPage</b> &mdash; title + subtitle props, default slot for content<br/>
		<br/>
		<b>UI Components</b><br/>
		&bull; <b>Box</b> &mdash; expandable overlay with animation (for images, code, etc.)<br/>
		&bull; <b>Note</b> &mdash; speaker notes (visible in FIXED mode below the slide)<br/>
		&bull; <b>Hint</b> &mdash; hint text at the bottom of a slide<br/>
		&bull; <b>Label</b> &mdash; hoverable highlighted text<br/>
		&bull; <b>YouTube</b> &mdash; YouTube thumbnail with QR code link<br/>
		&bull; <b>WideDiv</b> &mdash; horizontally scrollable container<br/>
		&bull; <b>Code</b> &mdash; Monaco editor for any language (read-only)<br/>
		&bull; <b>JavaCode</b> &mdash; Monaco editor specialised for Java<br/>
		&bull; <b>CodeBox</b> &mdash; Code inside an expandable Box<br/>
		&bull; <b>JavaCodeBox</b> &mdash; JavaCode inside an expandable Box
	</div>
</ContentPage>
