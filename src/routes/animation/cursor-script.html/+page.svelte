<!--
  Example: Cursor — chained scripts + note-triggered playback
  File: src/routes/animation/cursor-script.html/+page.svelte

  Three extensions to Cursor, on top of cursor-component.html's basic
  `path` targeting:

  - `script`: a CHAIN of warpTo/moveTo/around/attention commands
    (cursorScriptCore.ts) instead of an evenly-timed waypoint list — a
    bounce for emphasis, a lap around a dial, a size pulse to call
    attention to the cursor itself, composed on one timeline.
  - Every command can carry its own `size`, ambient from then on — the
    glyph can grow or shrink mid-flight, not just at one fixed size.
  - `startOn`: the flight sits idle until a NAMED trigger pulse fires,
    instead of autoplaying — the same pulse a checked `<Note data-trigger>`
    line fires in the presenter console. The button below fires the SAME
    pulse directly (fireTrigger), so this slide is interactive without a
    presenter window open.

  (`shape` — arrow/dot/ring glyph presets — is demoed statically at the
  bottom; see cursor-component.html for the base `path`/`size` story.)
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import Note from '$lib/components/Note.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Cursor, Draw } from '$lib/draw';
	import { fireTrigger } from '$lib/stores/triggers';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/cursor-script.html/+page.svelte';
</script>

<ContentPage
	title="Cursor — Scripts &amp; Note Triggers"
	subtitle="chained warpTo/moveTo/around, started by a checked speaker note"
	style="font-size: 0.9em"
>
	<div style="line-height: 1.5em;">
		<p>
			<code>script</code> chains commands instead of an evenly-timed
			<code>path</code>: <Label>warpTo</Label> cuts instantly, <Label>moveTo</Label>
			moves there directly by default (<code>times: 1</code>) — set <code>times: 2</code>
			for a there-and-back "shake" instead, alternating with every further
			<code>times</code> and landing back where it started on an EVEN count — and
			<Label>around</Label> orbits a centre — a Block name works there too —
			for <code>times</code> laps. Every repeat is baked into ONE generated
			flight, so it still rides the plain locked <code>Sprite</code> underneath.
		</p>
		<p>
			<Label>attention</Label> pulses the glyph bigger-then-normal <b>in place</b>
			— the cursor calling attention to itself, not a move — <code>times</code> pulses,
			each <code>period</code> seconds. Any command's own <code>size</code> becomes
			<b>ambient</b> from then on, so the glyph can grow or shrink mid-flight — the
			<code>warpTo</code> below lands already at size 60, and the pulse grows FROM there.
		</p>
		<p>
			<code>startOn="name"</code> makes the cursor wait, idle, until a
			<b>named trigger</b> pulses — fired by a checked
			<code>&lt;Note data-trigger="name"&gt;</code> line in the presenter
			console, or directly with <code>fireTrigger(name)</code>. Press the
			button (or, in the presenter console, check the note line below) —
			same pulse either way.
		</p>
		<QuickCode
			style="margin-top: 0.5em;"
			lang="svelte"
			code={`<Cursor
  startOn="fly"
  script={[
    { kind: "warpTo", at: [x, y], size: 60 },
    { kind: "moveTo", at: "menu-btn", times: 2, period: 0.8 },
    { kind: "around", at: "dial", rx: 90, ry: 90, times: 1, period: 1.8, click: true },
    { kind: "attention", times: 2, period: 0.5, scale: 1.6, click: true }
  ]}
/>

<Note>
  <li data-trigger="fly">Now watch the cursor fly</li>
</Note>`}
		/>
	</div>
</ContentPage>

<!-- The stage: a bounce target and an orbit centre. Ordinary Blocks — the
     script only knows them by name. -->
<Block name="menu-btn" x={1110} y={830} width={220} height={90} grid={10}>
	<div class="btn">Menu</div>
</Block>
<Block name="dial" x={1480} y={760} width={200} height={200} grid={10}>
	<div class="dial">◎</div>
</Block>

<Block name="fire-btn" x={1110} y={960} width={220} height={60} grid={10}>
	<button class="fire" on:click={() => fireTrigger('fly')}>
		Fire trigger →
	</button>
</Block>

<Draw
	title="A pointer that waits, then bounces, orbits and calls attention to itself"
	name="cursor-script-demo"
	description="A cursor sits idle until the 'fly' trigger fires, then warps to a rest point at size 60, bounces on the Menu button, orbits the dial, and finishes with two size pulses calling attention to itself."
>
	<Cursor
		startOn="fly"
		script={[
			{ kind: 'warpTo', at: [860,  500], size: 60 },
			{ kind: 'moveTo', at: [1130, 920], period: 0.8 },
			{ kind: 'moveTo', at: [1340, 920], times: 4, period: 0.8 },
			{ kind: 'around', at: 'dial', rx: 90, ry: 90, times: 2, period: 1.8, click: true },
			{ kind: 'attention', times: 2, period: 0.5, scale: 1.6, click: true }
		]}
	/>
</Draw>

<!-- The note the presenter console would check to fire the SAME pulse the
     button above fires directly (below the slide in SCALED mode / the
     presenter panel — see speaker-notes.html for where notes live). -->
<Note>
	<li data-trigger="fly">Now watch the cursor fly</li>
</Note>

<!-- A small static gallery of the built-in `shape` presets — arrow (the
     default), dot, ring — each a single-point `path` so there is no
     flight, just the glyph. -->
<Draw title="Cursor shape presets" name="cursor-shapes">
	<Cursor name="shape-arrow" shape="arrow" path={[[220, 800]]} size={44} />
	<Cursor name="shape-dot" shape="dot" path={[[380, 800]]} size={44} />
	<Cursor name="shape-ring" shape="ring" path={[[540, 800]]} size={44} />
</Draw>
<Block x={165} y={840} width={110} height={36} grid={10}>
	<div class="shape-label">arrow</div>
</Block>
<Block x={325} y={840} width={110} height={36} grid={10}>
	<div class="shape-label">dot</div>
</Block>
<Block x={485} y={840} width={110} height={36} grid={10}>
	<div class="shape-label">ring</div>
</Block>

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
		font-size: 26px;
		font-family: 'Fira Code', monospace;
		color: #c0f1ff;
	}
	.dial {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		border: 2px dashed rgba(240, 163, 62, 0.6);
		font-size: 48px;
		color: #f0a33e;
	}
	.fire {
		position: absolute;
		font: inherit;
		font-size: 24px;
		padding: 10px 22px;
		border-radius: 10px;
		border: 1px solid rgba(255, 255, 255, 0.25);
		background: color-mix(in srgb, #f0a33e 22%, transparent);
		color: #c0f1ff;
		cursor: pointer;
		width: 100%;
	}
	.fire:hover {
		background: color-mix(in srgb, #f0a33e 34%, transparent);
	}
	.shape-label {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-family: 'Fira Code', monospace;
		color: rgba(192, 241, 255, 0.6);
		text-align: center;
	}
</style>
