<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Toast" subtitle="Transient banner ± spotlight">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Toast</b> raises a short message that auto-dismisses. Optional <code>highlight</code> dims the slide around a named Block on the same beat.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Toast open={ok} highlight="deploy" text="Deployed!" onclose={() => (ok = false)} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>open / text / duration</code> — visibility, copy, ms (0 = sticky)</li>
			<li><code>highlight / placement</code> — Block name; top/bottom placement</li>
	</ul>

	</div>
</ContentPage>
