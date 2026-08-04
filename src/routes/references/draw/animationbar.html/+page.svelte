<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="AnimationBar" subtitle="Shared transport for the slide">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>AnimationBar</b> is the scrubbable playhead. Draw strokes, sprites, and other timeline citizens stay in sync because their motion is CSS driven from the same clock.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<AnimationBar />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>duration</code> — optional total length override</li>
	</ul>

	</div>
</ContentPage>
