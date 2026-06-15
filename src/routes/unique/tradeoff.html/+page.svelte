<!--
  Unique #6: The honest trade-off of route-per-slide
  File: src/routes/unique/tradeoff.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="The honest trade-off" subtitle="Every design choice costs something">
	<p>
		Because <b>one slide = one route</b>, moving between slides is a
		<b>full page load</b> &mdash; not client-side routing.
	</p>
	<ul style="margin-top: 0.4em;">
		<li>Animations live <b>within</b> a slide (reveals, build steps, emphasis) &mdash; that all works.</li>
		<li><b>Cross-slide</b> transitions (animating slide A into slide B) don't work out of the box.</li>
		<li>
			Want them anyway? That's a larger change &mdash; switch the nav to SvelteKit
			client-side <code>goto</code> plus a shared transition layer.
		</li>
	</ul>
	<p style="margin-top: 0.8em;">
		That's the cost of the route-per-slide design &mdash; and for clean diffs,
		colocated assets, and self-documenting slides, it's a trade worth making.
	</p>
</ContentPage>

<Hint text="Notice the page reloads as you move between slides — that's the route-per-slide design" />
