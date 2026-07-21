<!--
  Example: Cursor — a fake mouse pointer
  File: src/routes/animation/cursor-component.html/+page.svelte

  Cursor is a Sprite wearing a pointer, not a new engine: `path` resolves to
  canvas points — Block NAMES through the same blockAnchors registry
  Connector/Spotlight read, or literal [x, y] — and flies a LOCKED <Sprite>
  underneath, so the flight is ordinary generated CSS and the AnimationBar
  below scrubs it like any other shape. Mark a waypoint `click` and it flashes
  a ripple the instant the glyph arrives — a scripted "then I click Save"
  with no screen recording.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Cursor, Draw } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/cursor-component.html/+page.svelte';
</script>

<ContentPage
	title="Cursor — a Fake Pointer"
	subtitle="glide between named Blocks, click ripple on arrival"
>
	<div style="line-height: 1.5em;">
		<p>
			<code>Cursor</code>'s <Label>path</Label> is a list of waypoints — a Block
			<b>name</b> (resolved live through the same registry <code>Connector</code>/
			<code>Spotlight</code> read, so a target dragged in ADJUST carries the pointer
			with it) or a literal <code>[x, y]</code>. Mark one <code>click</code> and the
			pointer flashes a ripple the instant it arrives. Underneath it's a
			<b>locked</b> <code>Sprite</code> flying generated stops — nothing new to
			learn, and nothing of its own to save: the <code>&lt;Cursor&gt;</code> tag is
			the only source of truth. Flip <b>ADJUST</b> and drag either button below —
			the flight re-routes live.
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Draw>
  <Cursor
    path={[[420, 500], { at: "menu-btn", click: true }, { at: "save-btn", click: true }]}
    animate={2.2}
    delay={0.4}
  />
</Draw>`}
		/>
	</div>
</ContentPage>

<!-- The fake toolbar the pointer demos clicking through. Ordinary Blocks —
     Cursor knows nothing about them beyond their names. -->
<Block name="menu-btn" x={700} y={860} width={220} height={90} grid={10}>
	<div class="btn">File</div>
</Block>
<Block name="save-btn" x={1000} y={860} width={220} height={90} grid={10}>
	<div class="btn btn-accent">Save</div>
</Block>

<Draw
	title="A pointer clicking through a fake toolbar"
	name="cursor-demo"
	description="A cursor glyph glides from rest to the File button, clicks it, then glides to the Save button and clicks that — a scripted demo of a UI interaction with no screen recording."
>
	<!-- Three waypoints, one timeline: rest → File (click) → Save (click). -->
	<Cursor
		path={[[420, 500], { at: 'menu-btn', click: true }, { at: 'save-btn', click: true }]}
		animate={2.2}
		delay={0.4}
	/>
</Draw>

<!-- The ANIMATE control: the flight and the ripples are ordinary CSS
     animations, so the bar scrubs them exactly like any other shape's. -->
<AnimationBar highlight />

<ViewSource {source} {path} />

<style>
	.btn {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.18);
		font-size: 28px;
		font-family: 'Fira Code', monospace;
		color: #c0f1ff;
	}
	.btn-accent {
		background: color-mix(in srgb, #f0a33e 22%, transparent);
		border-color: #f0a33e;
	}
</style>
