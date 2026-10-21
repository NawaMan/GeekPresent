<!--
  Scene camera — one drawing, many shots, all on ONE slide.

  The parts sit in a <Group> with `glide`: change the group's camera (or its
  `hide`) and every part glides to its new box together — a zoom, a pan, a pull
  back. Each Space reveals the next caption line AND moves the camera, because
  the slide reads the build's current step (`<Steps let:revealed>`) and picks
  that shot from the list below. Once the build is spent, Space pages on.

  Nothing here is a transform on a wrapper: every part is redrawn at its true
  canvas box for each shot, so text, borders and the small print stay crisp at
  any zoom. The same Group, without `glide`, is what the transition deck's camera
  slides morph between ACROSS slides (transition/camera-*.html).

  In ADJUST, the glide switches off and every part drags in the scene's own
  units — whatever the zoom — and SAVE writes those back here.
-->
<script lang="ts">
	import EmptyPage from '$lib/templates/EmptyPage.svelte';
	import Block from '$lib/components/Block.svelte';
	import TextBlock from '$lib/components/TextBlock.svelte';
	import Group from '$lib/components/Group.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import Fragment from '$lib/components/Fragment.svelte';
	import Note from '$lib/components/Note.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/scene-camera.html/+page.svelte';

	/** One entry per step: the shot, and the line of code the caption shows for it. */
	const shots: { code: string; focus?: string; zoom?: number; fit?: string; pad?: number; hide: string[] }[] = [
		{ code: '<Group glide={0.9}>', hide: ['replica'] },
		{ code: 'focus="api" zoom={3}', focus: 'api', zoom: 3, hide: ['replica'] },
		{ code: 'focus="db" zoom={3}', focus: 'db', zoom: 3, hide: ['replica'] },
		{ code: "hide={['cache', 'queue']}", hide: ['cache', 'queue'] },
		{ code: 'fit="storage" pad={0.1}', fit: 'storage', pad: 0.1, hide: [] }
	];
</script>

<EmptyPage>
	<Steps let:revealed>
		{@const shot = shots[Math.min(revealed, shots.length - 1)]}
		<Group
			name="scene"
			glide={0.9}
			focus={shot.focus ?? null}
			zoom={shot.zoom ?? 1}
			fit={shot.fit ?? null}
			pad={shot.pad ?? 0}
			hide={shot.hide}
		>
			<TextBlock name="browser" x={160} y={420} width={260} height={140} bounds="none">Browser</TextBlock>
			<TextBlock name="api" x={620} y={380} width={340} height={220} bounds="none">
				<div class="part">
					<span>API</span>
					<small>GET /orders · POST /orders<br />auth → validate → handler</small>
				</div>
			</TextBlock>
			<!-- A nested group: one name for four parts, so `fit="storage"` frames them all. -->
			<Group name="storage">
				<TextBlock name="cache" x={1160} y={200} width={240} height={140} bounds="none">Cache</TextBlock>
				<TextBlock name="db" x={1160} y={420} width={340} height={220} bounds="none">
					<div class="part">
						<span>DB</span>
						<small>orders(id, user, total)<br />index on user</small>
					</div>
				</TextBlock>
				<TextBlock name="queue" x={1160} y={710} width={240} height={140} bounds="none">Queue</TextBlock>
				<TextBlock name="replica" x={1580} y={450} width={240} height={160} bounds="none">Replica</TextBlock>
			</Group>
		</Group>

		<!-- The caption sits OUTSIDE the group, so it stays put while the scene moves. -->
		<Block name="caption" x={60} y={880} width={1100} height={170} z={5}>
			<div class="caption">
				<h2>Scene camera — press Space</h2>
				<ol>
					<li><code>{shots[0].code}</code> — the whole drawing</li>
					<Fragment tag="li"><code>{shots[1].code}</code> — zoom in</Fragment>
					<Fragment tag="li"><code>{shots[2].code}</code> — pan across</Fragment>
					<Fragment tag="li"><code>{shots[3].code}</code> — pull back, a new cast</Fragment>
					<Fragment tag="li"><code>{shots[4].code}</code> — frame a nested group</Fragment>
				</ol>
			</div>
		</Block>
	</Steps>
</EmptyPage>

<Note>
	<ul>
		<li>One drawing in a Group with <code>glide</code>; each Space moves its camera.</li>
		<li>Zoom in on API: the small print becomes readable — content scales with its box.</li>
		<li>Pan to DB: same zoom, different focus.</li>
		<li>Pull back with a different cast: Cache and Queue fade out, Replica fades in.</li>
		<li>Frame the nested "storage" group by its name.</li>
	</ul>
</Note>

<ViewSource {source} {path} />

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
		padding-left: 1.4em;
		font-size: 0.55em;
		line-height: 1.5;
		columns: 2;
	}
</style>
