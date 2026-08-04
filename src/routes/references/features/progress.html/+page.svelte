<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Progress API" subtitle="Which page of how many">
	<div style="width: 100%; line-height: 1.5;">
		<p><code>getProgress()</code> exposes index, position, total, and fraction over <b>visible</b> slides (hidden appendices excluded). <code>ProgressBar</code> is the ready-made consumer.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`import { getProgress } from '\$lib/presentation';
const progress = getProgress();
// \$progress.position / \$progress.total / \$progress.fraction`} />


	</div>
</ContentPage>
