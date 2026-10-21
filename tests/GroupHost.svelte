<!--
  Test host for <Group>: a group holding two named Blocks (a, b), optionally
  nested inside an outer group, plus one Block OUTSIDE every group — the
  control that must render exactly as a plain Block always has.
-->
<script lang="ts">
	import Block from '$lib/components/Block.svelte';
	import Group from '$lib/components/Group.svelte';

	export let x = 0;
	export let y = 0;
	export let scale = 1;
	export let view: { x: number; y: number; width: number; height: number } | null = null;
	export let fit: string | null = null;
	export let pad = 0;
	export let focus: string | [number, number] | null = null;
	export let zoom = 1;
	export let bounds: 'canvas' | 'none' = 'none';
	/** Wrap the group in an outer one placed at (outerX, 0), scaled by outerScale. */
	export let nested = false;
	export let outerX = 0;
	export let outerScale = 1;
	export let outerFit: string | null = null;
	export let outerHide: string[] = [];
	export let hide: string[] = [];
	export let morph: string | null = null;
	export let morphOn: string | string[] | null = null;
</script>

{#if nested}
	<Group x={outerX} scale={outerScale} fit={outerFit} hide={outerHide} {morph} {morphOn}>
		<Group name="inner" {x} {y} {scale} {view} {fit} {pad} {focus} {zoom} {hide}>
			<Block name="a" x={100} y={100} width={200} height={100} {bounds}>A</Block>
			<Block name="b" x={400} y={300} width={100} height={50} {bounds}>B</Block>
		</Group>
	</Group>
{:else}
	<Group {x} {y} {scale} {view} {fit} {pad} {focus} {zoom} {hide} {morph} {morphOn}>
		<Block name="a" x={100} y={100} width={200} height={100} {bounds}>A</Block>
		<Block name="b" x={400} y={300} width={100} height={50} {bounds}>B</Block>
	</Group>
{/if}
<Block name="out" x={10} y={20} width={30} height={40}>OUT</Block>
