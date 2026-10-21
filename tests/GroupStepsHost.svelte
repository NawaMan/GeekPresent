<!--
  Test host: a Steps build driving a gliding Group's camera through
  `let:revealed`, the way animation/scene-camera.html does.
-->
<script lang="ts">
	import Block from '$lib/components/Block.svelte';
	import Group from '$lib/components/Group.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import Fragment from '$lib/components/Fragment.svelte';

	export let glide = 0.5;
	let steps: Steps;
	export const next = () => steps.next();
</script>

<Steps bind:this={steps} keys="off" let:revealed>
	<span class="step">{revealed}</span>
	<Group {glide} focus={revealed ? 'b' : null} zoom={revealed ? 2 : 1} hide={revealed ? ['a'] : []}>
		<Block name="a" x={100} y={100} width={200} height={100} bounds="none">A</Block>
		<Block name="b" x={400} y={300} width={100} height={50} bounds="none">B</Block>
	</Group>
	<Fragment>one</Fragment>
</Steps>
