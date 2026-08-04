<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Video" subtitle="Player with time bookmarks">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Video</b> plays a colocated file with themed chrome and optional chapter bookmarks that seek and highlight.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<script>
  import clip from './demo.mp4';
</script>
<Video src={clip} bookmarks={[
  { t: 0, label: 'Intro' },
  { t: 12, label: 'Demo' }
]} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>src</code> — imported media URL</li>
			<li><code>bookmarks</code> — time markers with labels</li>
	</ul>

	</div>
</ContentPage>
