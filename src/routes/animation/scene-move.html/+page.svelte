<!--
  Move something, and leave it there — slide 1 of 2.

  Space moves DB along: the slide reads the build's step (`<Steps let:revealed>`)
  and hands the scene a `move` for DB, by name — the scene has no prop of its own
  for it. The next slide (scene-moved.html) draws DB at the
  moved spot from the start, and the slide before this one never moved it at all.

  Paging BACK here from the next slide lands with the build already spent — DB
  where it was left, the caption line showing — so nothing jumps back. Shift+Space
  then plays the move in reverse.
-->
<script lang="ts">
	import EmptyPage from '$lib/templates/EmptyPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import Fragment from '$lib/components/Fragment.svelte';
	import Note from '$lib/components/Note.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import MoveScene from '../MoveScene.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/scene-move.html/+page.svelte';
</script>

<EmptyPage>
	<Steps let:revealed>
		<MoveScene move={revealed >= 1 ? { db: { x: 480 } } : {}} />

		<Block name="caption" x={60} y={860} width={1300} height={190} z={5}>
			<div class="caption">
				<h2>Move it, and leave it there — press Space</h2>
				<ol>
					<li><code>&lt;MoveScene move=&#123;revealed &gt;= 1 ? &#123; db: &#123; x: 480 &#125; &#125; : &#123;&#125;&#125; /&gt;</code></li>
					<Fragment tag="li">DB moves — and the next slide keeps it here. Page on, then page back.</Fragment>
				</ol>
			</div>
		</Block>
	</Steps>
</EmptyPage>

<Note>
	<ul>
		<li>One scene file shared by this slide and the next; a slide moves any part by name.</li>
		<li>Space moves DB; the next slide passes the moved value, so it stays put.</li>
		<li>Page back from the next slide: the build is already spent, DB is where we left it.</li>
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
	ol {
		margin: 0;
		font-size: 0.55em;
		line-height: 1.5;
	}
	ol {
		padding-left: 1.4em;
	}
</style>
