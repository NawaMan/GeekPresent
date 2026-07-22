<!--
  Example: VideoPage — bare (no chrome)
  File: src/routes/slides/videopage-bare.html/+page.svelte

  controls={false} drops the player bar. autoplay="kiosk" starts only while a
  kiosk session is running (normal paging leaves the clip idle). kioskHold
  (default true) keeps the auto-advance clock on this slide until the video
  ends — pageMs does not cut it short. Loop is off so one playthrough is enough.
-->
<script>
	import VideoPage from '$lib/components/VideoPage.svelte';
	import demo      from '../video-component.html/demo.mp4';
</script>

<VideoPage src={demo} controls={false} autoplay="kiosk" />
