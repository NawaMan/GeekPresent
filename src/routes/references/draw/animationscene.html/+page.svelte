<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="AnimationScene" subtitle="Scoped timeline region">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>AnimationScene</b> groups a bar + content so a slide can host more than one independent timeline (two demos, two bars).</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<AnimationScene>
  <AnimationBar />
  <Draw><!-- … --></Draw>
</AnimationScene>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>(children)</code> — bar + animated content</li>
	</ul>

	</div>
</ContentPage>
