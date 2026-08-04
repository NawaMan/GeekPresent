<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Gantt" subtitle="Spans and dependencies">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Gantt</b> draws time spans per row with optional dependency edges — plans and release trains.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Gantt {tasks} width={1000} height={480} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>tasks</code> — rows with start/end (and deps)</li>
	</ul>

	</div>
</ContentPage>
