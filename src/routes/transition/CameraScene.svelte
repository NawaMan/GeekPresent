<!--
  The camera demo's scene: ONE drawing, laid out once, that the camera slides
  aim at differently (camera-wide / camera-zoom / camera-pan / camera-out). Each
  slide passes only its shot — the parts are authored here, in the group's local
  coordinates, and never copied. A drag in ADJUST on any of those slides SAVEs
  back into THIS file.

  `morph="cam"` names every part (`cam-api`, …) and `morphOn="camera"` keeps the
  names to the 'camera' transition, so the browser glides each part from its box
  on the leaving slide to its box on the arriving one. That glide IS the zoom and
  pan. Per slide: `hide` takes parts out of the shot, and the slot adds that
  slide's own extras in scene coordinates.

  The small print inside API and DB is unreadable in the wide shot on purpose:
  a zoom scales a part's content with its box, so the detail becomes legible as
  the camera moves in.
-->
<script lang="ts">
	import Group from '$lib/components/Group.svelte';
	import TextBlock from '$lib/components/TextBlock.svelte';

	export let focus: string | null = null;
	export let zoom = 1;
	export let hide: string[] = [];
</script>

<Group name="scene" morph="cam" morphOn="camera" {focus} {zoom} {hide}>
	<TextBlock name="browser" x={160} y={470} width={260} height={140} bounds="none">Browser</TextBlock>
	<TextBlock name="api" x={620} y={430} width={340} height={220} bounds="none">
		<div class="part">
			<span>API</span>
			<small>GET /orders · POST /orders<br />auth → validate → handler</small>
		</div>
	</TextBlock>
	<TextBlock name="cache" x={1160} y={250} width={240} height={140} bounds="none">Cache</TextBlock>
	<TextBlock name="db" x={1160} y={470} width={340} height={220} bounds="none">
		<div class="part">
			<span>DB</span>
			<small>orders(id, user, total)<br />index on user</small>
		</div>
	</TextBlock>
	<TextBlock name="queue" x={1160} y={760} width={240} height={140} bounds="none">Queue</TextBlock>
	<slot />
</Group>

<style>
	.part {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}
	.part small {
		font-size: 11px;
		font-weight: normal;
		font-family: 'Fira Code', monospace;
		line-height: 1.4;
		opacity: 0.8;
	}
</style>
