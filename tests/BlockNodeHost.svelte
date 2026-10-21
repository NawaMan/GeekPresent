<!--
  Test host for BlockNode: a labelled node (slot content needs a parent to supply
  it) plus a plain ImageBlock carrying a z, for the forwarding check.
-->
<script lang="ts">
	import BlockNode from '$lib/components/BlockNode.svelte';
	import ImageBlock from '$lib/components/ImageBlock.svelte';

	export let z = 0;
	export let imageZ = 0;
</script>

<BlockNode name="api" x={100} y={200} width={240} height={110} grid={10} {z}>API</BlockNode>
<ImageBlock name="pic" src="x.png" x={500} y={500} width={50} height={50} z={imageZ} />
