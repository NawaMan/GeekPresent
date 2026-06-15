<!--
  Unique #4: Two artifact types from one component set
  File: src/routes/unique/two-artifacts.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="One framework, two kinds of artifact" subtitle="The same components build both — you author each kind for itself">
	<p>The same framework &mdash; and the same <code>$lib</code> components &mdash; let you build two different things:</p>
	<ul style="margin-top: 0.4em;">
		<li>
			<b>Presentation</b> &mdash; many fixed slides, advanced one at a time
			(what you're looking at now).
		</li>
		<li>
			<b>Text</b> &mdash; one long page that flows downward and scrolls,
			written to be read at your own pace.
		</li>
	</ul>
	<p style="margin-top: 0.6em;">
		They're <b>separate artifacts you author</b>, not one auto-converted into the other.
		A <code>setMode</code> flag lets the shared components adapt to whichever they're
		in &mdash; e.g. the nav bar collapses to a single <b>TOP</b> button in a Text.
	</p>
	<p style="margin-top: 0.6em;">
		See both kinds:
		<a href="../text.html" style="color: #7fd9ff;">the sample Text &rarr;</a>
		&nbsp;&middot;&nbsp;
		<a href="../" style="color: #7fd9ff;">the home page (also a Text) &rarr;</a>
	</p>
</ContentPage>
