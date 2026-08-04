<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="State" subtitle="URL, localStorage, stores">
	<div style="width: 100%; line-height: 1.5;">
		<p>Remember values with <code>persisted()</code> from <code>$lib/stores/persisted</code>, read query params via <code>stateCore</code> helpers, and keep codecs total (junk → safe default). Guard <code>window</code> / storage with <code>browser</code>.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`import { persisted } from '\$lib/stores/persisted';
import { numberCodec } from '\$lib/utils/stateCore';
const zoom = persisted('my-zoom', 1, { codec: numberCodec({ min: 0.5, max: 3 }) });`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>sync</code> — cross-tab mirror; opt out when audience must not follow</li>
	</ul>

	</div>
</ContentPage>
