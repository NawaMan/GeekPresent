<!--
  Camera (out) — back to the wide shot, with a different CAST: Cache and Queue
  hidden (they fade out as the camera pulls back), and a Replica that exists on
  this slide alone, added through the scene slot in scene coordinates — so it
  rides the same camera as everything else. Its tag lives HERE, so a SAVE of it
  lands in this file, while a SAVE of a scene part lands in CameraScene.svelte.
-->
<script>
	import TextBlock from '$lib/components/TextBlock.svelte';
	import CameraSlide from '../CameraSlide.svelte';
</script>

<CameraSlide
	title="Group Camera (out)"
	code={"<CameraScene hide={['cache', 'queue']}>"}
	hide={['cache', 'queue']}
>
	Wide again, a different cast: two parts hidden, one added just for this slide.
	<TextBlock slot="scene" name="replica" x={1580} y={500} width={240} height={160} bounds="none">Replica</TextBlock>
</CameraSlide>
