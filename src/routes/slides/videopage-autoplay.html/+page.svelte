<!--
  Example: VideoPage — autoplay in kiosk only
  File: src/routes/slides/videopage-autoplay.html/+page.svelte

  autoplay="kiosk" starts the video when Kiosk is running (muted by default;
  chrome stays on so unmute/scrub remain usable). Outside kiosk the slide sits
  at the first frame until you press play. The runner holds on the clip's own
  duration, then pages — no fixed 6s cut-off.
-->
<script>
	import VideoPage from '$lib/components/VideoPage.svelte';
	import demo      from '../video-component.html/demo.mp4';
</script>

<VideoPage src={demo} autoplay="kiosk" />
