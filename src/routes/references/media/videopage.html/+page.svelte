<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="VideoPage" subtitle="Full-canvas video slide">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<b>VideoPage</b> is a complete slide: the player fills the canvas
			(sibling of <b>Video</b>, which is an in-flow element).
		</p>
		<p style="margin-top: 0.6em;">
			Docs (with AppendixLink to a live canvas):
			<a href="../slide-pages/videopage.html">Slide Pages → VideoPage</a>
		</p>
		<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<VideoPage src={clip} keys="global" bookmarks={[
  { at: '0:00', label: 'Start' }
]} />`} />
		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>src / bookmarks / keys</code> — media, chapters, Space semantics</li>
			<li><code>controls / autoplay / muted</code> — chrome and playback</li>
		</ul>
	</div>
</ContentPage>
