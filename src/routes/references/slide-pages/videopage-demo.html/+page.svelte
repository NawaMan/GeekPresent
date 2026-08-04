<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import VideoPage from '$lib/components/VideoPage.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import demo from '../../../slides/video-component.html/demo.mp4';
</script>

<!--
  Hidden appendix: full-canvas VideoPage + AppendixPage for RETURN.
  VideoPage fills the canvas; RETURN stays in the appendix nav bar above it.
-->
<AppendixPage title="" subtitle="" rule={false}>
	<VideoPage
		src={demo}
		keys="global"
		bookmarks={[
			{ at: '0:00', label: 'Start' },
			{ at: '0:05', label: 'Mid' }
		]}
	/>
</AppendixPage>

<Hint text="Space steps bookmarks (keys=global). RETURN / ↑ / Backspace leaves the appendix." />
