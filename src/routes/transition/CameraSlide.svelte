<!--
  One camera slide: the shared scene, aimed by `focus` / `zoom` and cast by
  `hide`, with a caption card pinned top-left OUTSIDE the group — so the card
  stays put while the scene zooms and pans beneath it. A slide's own scene extras
  go in its `slot="scene"`. The camera slides differ only in these.
-->
<script lang="ts">
	import EmptyPage from '$lib/templates/EmptyPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import CameraScene from './CameraScene.svelte';

	export let title: string;
	export let code: string;
	export let focus: string | null = null;
	export let zoom = 1;
	export let hide: string[] = [];
</script>

<EmptyPage>
	<!-- The `scene` slot lands INSIDE the scene's Group: a slide's extras are
	     authored in scene coordinates and ride its camera. -->
	<CameraScene {focus} {zoom} {hide}><slot name="scene" /></CameraScene>
	<Block name="caption" x={60} y={50} width={760} height={190} z={5}>
		<div class="caption">
			<h2>{title}</h2>
			<QuickCode {code} />
			<p><slot /></p>
		</div>
	</Block>
</EmptyPage>

<style>
	.caption {
		text-align: left;
		padding: 16px 22px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--surface-bg, #181818) 88%, transparent);
	}
	h2 {
		margin: 0 0 10px;
		font-size: 1.15em;
	}
	p {
		margin: 10px 0 0;
		font-size: 0.6em;
		line-height: 1.35;
		opacity: 0.85;
	}
</style>
