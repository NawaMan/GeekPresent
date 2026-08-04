<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Tabs & Tab" subtitle="One panel visible at a time">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Tabs</b> collects <b>Tab</b> children into a strip + panel. Good for API vs CLI vs config without leaving the slide.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Tabs>
  <Tab label="API">REST shape…</Tab>
  <Tab label="CLI">flags…</Tab>
</Tabs>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>label</code> — on each Tab — the strip text</li>
	</ul>

	</div>
</ContentPage>
