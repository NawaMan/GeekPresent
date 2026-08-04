<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="How to use this catalog" subtitle="Hub → group → component">
	<div style="width: 100%; line-height: 1.5;">
		<p>Each slide in this hub introduces a <b>group</b>. Follow the link into that group’s own deck for one slide per component.</p>
		<ul style="margin: 0.7em 0 0 1.2em; line-height: 1.5;">
			<li><b>Hub</b> — map of the toolbox (<code>/references</code>)</li>
			<li><b>Group deck</b> — <code>/references/&lt;group&gt;/…</code></li>
			<li><b>Component slide</b> — problem, minimal snippet, props that matter, gotchas</li>
		</ul>
		<p style="margin-top: 0.8em;">These pages are written as <b>references</b> for authors and agents. They deliberately do not reuse the older in-deck “dev buddy” samples under <code>/slides</code>.</p>
		<p style="margin-top: 0.6em;">Import paths stay the same everywhere: <code>$lib/components/…</code>, <code>$lib/chart</code>, <code>$lib/draw</code>, <code>$lib/templates/…</code>.</p>



	</div>
</ContentPage>
