<!--
  Camera (pan) — same zoom, aimed at DB instead: the move from the zoom slide
  is a pan. → pulls back out to a wide shot with a different cast.
-->
<script>
	import CameraSlide from '../CameraSlide.svelte';
</script>

<CameraSlide title="Group Camera (pan)" code={'<Group focus="db" zoom={4}>'} focus="db" zoom={4}>
	Same zoom, a different focus — so the move is a pan. → pulls back out.
</CameraSlide>
