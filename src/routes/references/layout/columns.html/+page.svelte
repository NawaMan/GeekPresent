<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Columns & Column" subtitle="Grid splits, optional live gutters">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Columns</b> lays out <b>Column</b> children on a simple grid. Unequal <code>widths</code> make a media/text split without a second component.</p>
		<p style="margin-top: 0.5em;">Pass <code>resizable</code> so viewers (and ADJUST) can drag gutters; copy the ratio chip back into source — a drag does not auto-save.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Columns widths={[1, 2]} gap="1.5em">
  <Column>Sidebar</Column>
  <Column>Main copy</Column>
</Columns>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>widths</code> — relative fractions per column</li>
			<li><code>gap</code> — gutter size</li>
			<li><code>resizable</code> — viewer-draggable gutters</li>
	</ul>

	</div>
</ContentPage>
