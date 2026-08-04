<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="SpriteStudio" subtitle="Keyframe authoring wrapper">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>SpriteStudio</b> is the authoring shell for multi-stop sprite motion — define keyframes in one place instead of hand-writing every stop array.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<SpriteStudio><!-- keyframe editor + preview --></SpriteStudio>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>stops / path</code> — depending on studio mode</li>
	</ul>

	</div>
</ContentPage>
