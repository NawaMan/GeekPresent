<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Cursor" subtitle="Fake pointer for UI demos">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Cursor</b> is a pointer glyph that glides or runs a script (<code>warpTo</code>, <code>moveTo</code>, <code>around</code>, <code>attention</code>). Gate with <code>startOn</code> and a Note trigger from the presenter console.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Cursor path={[[100,100],[400,300]]} size={48} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>path / script</code> — track or command list</li>
			<li><code>startOn</code> — named trigger pulse</li>
	</ul>

	</div>
</ContentPage>
