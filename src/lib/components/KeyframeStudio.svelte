<!--
  KeyframeStudio — a reusable LAYOUT-mode authoring tool for @keyframes animations.

  Drop it on ANY slide that wants to fly one element along a path of positioned
  stops. It owns the whole authoring loop so a page only supplies the moving
  element's content + the initial stops:

      <KeyframeStudio
          name="fly"
          duration={2.5}
          fontScale={0.84}
          initialStops={[
              { pct: 0,   x: 557,  y: 780, w: 56,  h: 55  },
              { pct: 100, x: 1521, y: 424, w: 228, h: 219 },
          ]}
      >🚀</KeyframeStudio>

  What it provides:
    - one ghost <Block> per stop (drag in LAYOUT mode to move that stop);
    - the moving element (the default <slot/>), driven by ONE Web Animations API
      animation rebuilt live from the stops;
    - a draggable / collapsible panel to edit each stop's %, add/remove stops and
      set the overall time, with the @keyframes rebuilt live + a Copy button;
    - an <AnimationBar/> to scrub the result.

  WHY POSITIONS, NOT TIME/EASING: stop %s are relative to the total, so they're
  duration-independent. Duration + easing are PLAYBACK — keep them in your own
  `animation:` rule (and any non-geometry track like color in a separate
  @keyframes). The Copy here only ever carries positions (+ optional font-size).

  WHY THE NUMBERS MATCH: a <Block>'s x/y are canvas-origin; a keyframe's left/top
  are relative to the offset parent. They agree because this component renders its
  ghosts and the moving element as TOP-LEVEL position:absolute siblings (Svelte
  adds no wrapper), so the canvas (.content) is their offset parent — Block-x ===
  keyframe-left, no math. Place <KeyframeStudio/> as a direct child of the slide
  (not inside a position:relative panel), exactly like a bare <Block>.
-->
<script lang="ts">
	import Block        from '$lib/components/Block.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import { layoutMode, canLayout } from '$lib/stores/layoutMode';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type Stop = { pct: number; x: number; y: number; w: number; h: number };

	/** @keyframes name — used only in the copied text + panel title. */
	export let name = 'fly';
	/** Starting stops (each a located box at a moment in time). Cloned internally;
	    nothing is saved — this is a finder, reset on reload. */
	export let initialStops: Stop[] = [
		{ pct: 0,   x: 557,  y: 780, w: 56,  h: 55  },
		{ pct: 100, x: 1521, y: 424, w: 228, h: 219 },
	];
	/** Overall preview time in seconds (editable in the panel). */
	export let duration = 2.5;
	/** Playback easing for the live preview. (Not copied — keep it in your own rule.) */
	export let easing = 'ease-in-out';
	/** When set, emit `font-size: h*fontScale` on every frame so a glyph grows with
	    the box (the rocket case uses 0.84). null = no font-size track. */
	export let fontScale: number | null = null;

	// The readout/editor only when the LAYOUT control is available AND switched on.
	$: editing = $canLayout && $layoutMode;

	// --- Keyframe stops: the source of truth. One ghost <Block> per stop binds its
	// geometry here; the animation is rebuilt from these.
	let stops: Array<Stop & { id: number }> = initialStops.map((s, i) => ({ ...s, id: i }));
	let nextId = stops.length;

	const r = (n: number) => Math.round(n);
	const fontFor = (h: number) => (fontScale == null ? null : Math.round(h * fontScale));
	const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
	// A keyframe percent is 0..100; coerce a mid-edit empty/NaN field to 0.
	const safePct = (p: number) => clamp(Number.isFinite(+p) ? Math.round(+p) : 0, 0, 100);

	// Sorted view drives the frames + readout; the array stays in add order so each
	// ghost keeps a stable index to bind by.
	$: sorted = [...stops].sort((a, b) => safePct(a.pct) - safePct(b.pct));
	$: base = sorted[0] ?? { x: 0, y: 0, w: 100, h: 100 };

	// WAAPI keyframes from the stops (offset 0..1). font-size only when fontScale set.
	$: frames = sorted.map((s) => {
		const f: Keyframe = {
			offset: safePct(s.pct) / 100,
			left:   `${r(s.x)}px`,
			top:    `${r(s.y)}px`,
			width:  `${r(s.w)}px`,
			height: `${r(s.h)}px`,
		};
		const fs = fontFor(s.h);
		if (fs != null) f.fontSize = `${fs}px`;
		return f;
	});

	$: durSec = clamp(Number(durationSec) || 0.1, 0.1, 60);   // sanitised seconds
	$: durationMs = durSec * 1000;
	let durationSec = duration;

	// Copy-ready @keyframes — N stops, sorted, rebuilt live. Positions only.
	$: keyframesText =
		`@keyframes ${name} {\n` +
		sorted
			.map((s) => {
				const fs = fontFor(s.h);
				return (
					`  ${(safePct(s.pct) + '%').padStart(4)} { left:${r(s.x)}px; top:${r(s.y)}px; ` +
					`width:${r(s.w)}px; height:${r(s.h)}px;${fs != null ? ` font-size:${fs}px;` : ''} }`
				);
			})
			.join('\n') +
		`\n}`;

	function addStop() {
		// Insert into the widest gap, geometry lerped onto the path between neighbours.
		const s = sorted;
		let gi = 0, gap = -1;
		for (let k = 0; k < s.length - 1; k++) {
			const g = s[k + 1].pct - s[k].pct;
			if (g > gap) { gap = g; gi = k; }
		}
		const a = s[gi], b = s[gi + 1] ?? s[gi];
		const mid = (p: number, q: number) => Math.round((p + q) / 2);
		stops = [...stops, {
			id: nextId++, pct: mid(a.pct, b.pct),
			x: mid(a.x, b.x), y: mid(a.y, b.y), w: mid(a.w, b.w), h: mid(a.h, b.h),
		}];
	}
	function removeStop(id: number) {
		if (stops.length <= 2) return;   // keep at least a start and an end
		stops = stops.filter((s) => s.id !== id);
	}

	// Clamp on commit (blur / Enter), so typing stays free and snaps into range after.
	function commitPct(i: number) { stops[i].pct = safePct(stops[i].pct); }
	function commitDur()  { durationSec = clamp(Number(durationSec) || 0.1, 0.1, 60); }

	// --- The live animation, driven imperatively so it stays ONE Animation object
	// (AnimationBar keeps its handle). Position edits swap keyframes in place; a
	// duration edit retimes it and asks the bar to re-read the envelope.
	let bar: AnimationBar;
	let targetEl: HTMLElement;
	let anim: Animation | null = null;

	onMount(() => {
		anim = targetEl.animate(frames, { duration: durationMs, easing, fill: 'both' });
		bar?.rescan?.();
		return () => anim?.cancel();
	});

	$: if (anim) anim.effect?.setKeyframes(frames);
	$: if (anim) { anim.effect?.updateTiming({ duration: durationMs }); bar?.rescan?.(); }

	let copied = false;
	async function copyKeyframes() {
		try {
			await navigator.clipboard.writeText(keyframesText);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			window.prompt('Copy these @keyframes:', keyframesText);
		}
	}

	// Panel chrome: drag it by its header, or collapse to just the header. Offset is
	// a transform in CANVAS px (so it scales with the deck); the pointer delta is
	// divided by the live render scale, exactly like <Block>. Position + collapsed
	// state persist in localStorage, keyed by `name` so two studios don't collide.
	const PANEL_KEY = `kfPanel:${name}`;
	function loadPanel() {
		if (!browser) return { dx: 0, dy: 0, min: false };
		try {
			const s = JSON.parse(localStorage.getItem(PANEL_KEY) || 'null');
			if (s) return { dx: Number(s.dx) || 0, dy: Number(s.dy) || 0, min: !!s.min };
		} catch {}
		return { dx: 0, dy: 0, min: false };
	}
	const savedPanel = loadPanel();

	let panelEl: HTMLElement;
	let panelDX = savedPanel.dx, panelDY = savedPanel.dy;
	let minimized = savedPanel.min;

	$: if (browser)
		localStorage.setItem(PANEL_KEY, JSON.stringify({ dx: panelDX, dy: panelDY, min: minimized }));

	function startPanelDrag(event: PointerEvent) {
		event.preventDefault();
		const scale = panelEl.getBoundingClientRect().width / panelEl.offsetWidth || 1;
		const startPX = event.clientX, startPY = event.clientY;
		const baseDX = panelDX, baseDY = panelDY;
		const onMove = (e: PointerEvent) => {
			panelDX = baseDX + (e.clientX - startPX) / scale;
			panelDY = baseDY + (e.clientY - startPY) / scale;
		};
		const onUp = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}
</script>

<!-- Ghost guides: one Block per stop, geometry two-way bound to that stop. These are
     AUTHORING scaffolding — shown only in LAYOUT mode, so a viewer never sees the
     dashed %-boxes. The animation is built from the `stops` data (not these nodes),
     so hiding them changes nothing the audience sees. Index binding keeps `stops`
     the invalidated root. -->
{#if editing}
{#each stops as stop, i (stop.id)}
<Block name={`${stop.pct}%`} bind:x={stops[i].x} bind:y={stops[i].y} bind:width={stops[i].w} bind:height={stops[i].h}>
	<div class="kfs-ghost">{stop.pct}%</div>
</Block>
{/each}
{/if}

<!-- The animated element: a top-level absolute sibling, so its left/top live in the
     SAME canvas space the Blocks report. Inline style is the pre-JS base (first
     stop); the WAAPI animation (fill:both) takes over once mounted. -->
<div
	class="kfs-target"
	bind:this={targetEl}
	style="left:{r(base.x)}px; top:{r(base.y)}px; width:{r(base.w)}px; height:{r(base.h)}px;{fontFor(base.h) != null ? ` font-size:${fontFor(base.h)}px;` : ''}"
>
	<slot />
</div>

<!-- Live @keyframes readout + stop editor — only in LAYOUT mode. -->
{#if editing}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="kf-readout no-print"
	class:minimized
	bind:this={panelEl}
	style="transform: translate({panelDX}px, {panelDY}px);"
>
	<div class="kf-head" on:pointerdown={startPanelDrag}>
		<span class="kf-title">@keyframes {name} · {stops.length} stops</span>
		<button
			class="kf-min"
			type="button"
			aria-label={minimized ? 'Expand' : 'Minimize'}
			on:pointerdown|stopPropagation
			on:click={() => (minimized = !minimized)}
		>{minimized ? '+' : '−'}</button>
	</div>
	{#if !minimized}
	<div class="kf-stops">
		{#each stops as stop, i (stop.id)}
		<div class="kf-row">
			<input class="kf-pct" type="number" min="0" max="100" step="1" bind:value={stops[i].pct} on:change={() => commitPct(i)} aria-label="keyframe percent" />
			<span class="kf-pctsign">%</span>
			<span class="kf-sec">= {(safePct(stop.pct) / 100 * durSec).toFixed(2)}s</span>
			<button
				class="kf-del"
				type="button"
				title="Remove this stop"
				disabled={stops.length <= 2}
				on:click={() => removeStop(stop.id)}
			>✕</button>
		</div>
		{/each}
	</div>
	<div class="kf-controls">
		<button class="kf-add" type="button" on:click={addStop}>+ keyframe</button>
		<label class="kf-dur">time
			<input type="number" min="0.1" max="60" step="0.1" bind:value={durationSec} on:change={commitDur} aria-label="overall time, seconds" />s
		</label>
	</div>
	<pre>{keyframesText}</pre>
	<button class="kf-copy" type="button" on:click={copyKeyframes}>
		{copied ? 'Copied!' : 'Copy @keyframes'}
	</button>
	{/if}
</div>
{/if}

<!-- Presence of this bar = "this slide has a finite keyframe animation". -->
<AnimationBar bind:this={bar} />

<style>
	.kfs-ghost {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Fira Code', monospace;
		font-weight: bold;
		font-size: 0.8em;
		color: rgba(255, 255, 255, 0.45);
		border: 2px dashed rgba(255, 255, 255, 0.25);
		border-radius: 10px;
		box-sizing: border-box;
	}

	/* Positioned in canvas pixels; the WAAPI animation drives left/top/width/height
	   (+ font-size when fontScale is set), so box + content grow together as it
	   travels. */
	.kfs-target {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.kf-readout {
		position: absolute;
		left: 40px;
		bottom: 56px;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5em;
		padding: 0.6em 0.7em 0.7em;
		background: rgba(18, 18, 18, 0.92);
		border: 1px solid var(--ctrl-strong-bg, #2980b9);
		border-radius: 8px;
		z-index: 50;
	}
	.kf-readout.minimized {
		gap: 0;
		padding-bottom: 0.6em;
	}
	.kf-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.2em;
		cursor: move;
		user-select: none;
		touch-action: none;
	}
	.kf-title {
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		color: #9aa7b0;
	}
	.kf-min {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		font-weight: bold;
		line-height: 1;
		cursor: pointer;
		border: 0;
		border-radius: 5px;
		background: var(--ctrl-bg, #181818);
		color: #cfe3f2;
	}
	.kf-min:hover { background: var(--ctrl-hover-bg, #2980b9); color: #fff; }

	/* Stop list: one row per keyframe — editable %, remove button. */
	.kf-stops {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em 0.8em;
	}
	.kf-row {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
	}
	.kf-pctsign { font-family: 'Fira Code', monospace; font-size: 18px; color: #9aa7b0; }
	.kf-sec { font-family: 'Fira Code', monospace; font-size: 15px; color: #6f7d86; }
	.kf-del {
		font-family: 'Fira Code', monospace;
		font-size: 15px;
		line-height: 1;
		cursor: pointer;
		border: 0;
		border-radius: 4px;
		padding: 0.15em 0.4em;
		margin-left: 0.15em;
		background: var(--ctrl-bg, #181818);
		color: #cfe3f2;
	}
	.kf-del:hover:not(:disabled) { background: #b3402e; color: #fff; }
	.kf-del:disabled { opacity: 0.35; cursor: default; }

	.kf-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
	}
	.kf-add {
		font-family: 'Fira Code', monospace;
		font-size: 16px;
		font-weight: bold;
		cursor: pointer;
		border: 0;
		border-radius: 5px;
		padding: 0.3em 0.8em;
		background: var(--ctrl-strong-bg, #2980b9);
		color: var(--on-accent, #ffffff);
	}
	.kf-dur {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		color: #9aa7b0;
	}
	.kf-pct, .kf-dur input {
		width: 3.4em;
		font-family: 'Fira Code', monospace;
		font-size: 18px;
		color: #cfe3f2;
		background: var(--ctrl-bg, #181818);
		border: 1px solid var(--ctrl-strong-bg, #2980b9);
		border-radius: 5px;
		padding: 0.15em 0.3em;
	}

	.kf-readout pre {
		margin: 0;
		font-family: 'Fira Code', monospace;
		font-size: 22px;
		line-height: 1.45;
		color: #cfe3f2;
		white-space: pre;
	}
	.kf-copy {
		align-self: flex-start;
		font-family: 'Fira Code', monospace;
		font-weight: bold;
		font-size: 18px;
		cursor: pointer;
		border: 0;
		border-radius: 5px;
		padding: 0.3em 0.9em;
		background: var(--ctrl-selected-bg, #00b356);
		color: var(--on-accent, #ffffff);
	}
</style>
