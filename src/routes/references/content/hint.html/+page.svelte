<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Hint" subtitle="Quiet cue at the edge">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Hint</b> is a low-emphasis prompt (often bottom-of-slide): “press Space”, “scan the QR”, “next is live demo”. It is not a speaker note.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Hint>Press Space to reveal the next step</Hint>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>style / class</code> — placement tweaks when needed</li>
	</ul>

	</div>
</ContentPage>
