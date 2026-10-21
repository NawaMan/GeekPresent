<!--
  The drawing shared by scene-move.html and scene-moved.html — one file, so both
  slides show the same parts and a drag in ADJUST lands here (SAVE follows a Block
  into the file that wrote it).

  The scene knows nothing about which part moves. It forwards `move` to its Group
  (as it would `hide`), and each slide names the part and where it goes:
  `<MoveScene move={{ db: { x: 480 } }} />`. The part's own x/y below stay where
  it is drawn, and stay what a drag saves.

  `glide` animates a change WITHIN a slide. Across slides nothing needs to move:
  the next slide already draws DB where this one left it.
-->
<script lang="ts">
	import TextBlock from '$lib/components/TextBlock.svelte';
	import Group from '$lib/components/Group.svelte';
	import type { MoveMap } from '$lib/utils/groupCore';

	/** Parts to put somewhere else on this slide, by name (see Group's `move`). */
	export let move: MoveMap = {};
</script>

<Group name="move-scene" glide={0.9} {move}>
	<TextBlock name="browser" x={160} y={380} width={260} height={140}>Browser</TextBlock>
	<TextBlock name="api" x={620} y={380} width={300} height={140}>API</TextBlock>
	<TextBlock name="cache" x={1120} y={380} width={260} height={140}>Cache</TextBlock>
	<TextBlock name="db" x={1120} y={600} width={260} height={140}>DB</TextBlock>
</Group>
