<!--
  Camera (zoom) — the same scene, ×4 about API. Nothing here is re-laid-out by
  hand: the group maps every part, and the morph glides them there.
-->
<script>
	import CameraSlide from '../CameraSlide.svelte';
</script>

<CameraSlide title="Group Camera (zoom)" code={'<Group focus="api" zoom={4}>'} focus="api" zoom={4}>
	Same scene, one prop changed. Its small print is readable now; → pans across to DB.
</CameraSlide>
