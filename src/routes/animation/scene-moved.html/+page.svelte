<!--
  Move something, and leave it there — slide 2 of 2.

  This slide never animates DB. It draws the shared scene with the value the
  previous slide moved it to, so paging forward shows no jump. Every later slide
  would do the same: the position is just a prop each slide passes.
-->
<script lang="ts">
	import EmptyPage from '$lib/templates/EmptyPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import Note from '$lib/components/Note.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import MoveScene from '../MoveScene.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/scene-moved.html/+page.svelte';
</script>

<EmptyPage>
	<MoveScene move={{ db: { x: 480 } }} />

	<Block name="caption" x={60} y={860} width={1300} height={190} z={5}>
		<div class="caption">
			<h2>…and it stays there</h2>
			<p><code>&lt;MoveScene move=&#123;&#123; db: &#123; x: 480 &#125; &#125;&#125; /&gt;</code> — this slide, and every one after it.</p>
			<p>Page back (← or Shift+Space): the previous slide opens with DB already moved.</p>
		</div>
	</Block>
</EmptyPage>

<Note>
	<ul>
		<li>Same scene, DB already at its new spot: no jump when paging forward.</li>
		<li>Page back: the previous slide's build opens spent, so it matches this one.</li>
	</ul>
</Note>

<ViewSource {source} {path} />

<style>
	.caption {
		text-align: left;
		padding: 14px 22px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--surface-bg, #181818) 90%, transparent);
	}
	h2 {
		margin: 0 0 6px;
		font-size: 0.9em;
	}
	p {
		margin: 0;
		font-size: 0.55em;
		line-height: 1.5;
	}
</style>
