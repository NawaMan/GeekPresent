<!--
  Example: Canvas — imperative JS drawing on the shared keyframe playhead
  File: src/routes/animation/canvas-draw.html/+page.svelte

  A <Canvas> is raw pixels, but it rides the SAME timeline as the CSS/SVG
  shapes: it owns a hidden finite @keyframes "clock", so <AnimationBar> finds
  it via getAnimations() and scrubs it like anything else. Here the draw()
  callback is a PURE function of the frame — an orbiting node whose position
  comes from interpolated `keyframes` value tracks (x/y with per-stop ease),
  plus a pulse ring sized straight off `progress`. Because it reads the clock
  each frame rather than integrating time, dragging the bar reproduces every
  frame exactly — scrub it forward and back and the node retraces its path.

  It's also INTERACTIVE: click drops a pin, double-click clears them. The
  handlers get the pointer in canvas px (mapped through the deck's scaling),
  hit-test-ready; pins are state OUTSIDE the frame, so `redraw()` repaints.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Label from '$lib/components/Label.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Canvas, type CanvasFrame, type CanvasPointerEvent, type CanvasStop } from '$lib/draw';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation/canvas-draw.html/+page.svelte';

	// Interaction state — lives OUTSIDE the frame (a click isn't a moment on the
	// playhead). draw() reads it; the handlers mutate it and call redraw().
	let pins: Array<{ x: number; y: number }> = [];

	// Value tracks: the node's x/y at each beat (canvas px within the surface),
	// with an ease on the segment starting at each stop — same pct/ease grammar
	// as the path shapes' stops, tweened in JS and handed to draw() as `values`.
	const keyframes: CanvasStop[] = [
		{ pct: 0, x: 120, y: 460, ease: 'ease-in' },
		{ pct: 35, x: 760, y: 90, ease: 'ease-in-out' },
		{ pct: 70, x: 1360, y: 470, ease: 'ease-out' },
		{ pct: 100, x: 760, y: 470 }
	];

	function render(ctx: CanvasRenderingContext2D, { width, height, progress, values }: CanvasFrame) {
		ctx.clearRect(0, 0, width, height);

		// Trail: re-plot the interpolated path up to the playhead so the scrub
		// draws exactly what has happened by `progress` (pure function of time).
		ctx.lineWidth = 4;
		ctx.strokeStyle = 'rgba(41,128,185,0.45)';
		ctx.beginPath();
		for (let p = 0; p <= progress; p += 0.01) {
			const v = pathAt(p * 100);
			p === 0 ? ctx.moveTo(v.x, v.y) : ctx.lineTo(v.x, v.y);
		}
		ctx.stroke();

		const x = values.x ?? 120;
		const y = values.y ?? 460;

		// Pulse ring — radius straight off progress, fading as it grows.
		const r = 20 + progress * 90;
		ctx.strokeStyle = `rgba(240,163,62,${1 - progress})`;
		ctx.lineWidth = 6;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.stroke();

		// The travelling node.
		ctx.fillStyle = '#F0A33E';
		ctx.beginPath();
		ctx.arc(x, y, 26, 0, Math.PI * 2);
		ctx.fill();

		// User-dropped pins (interaction state, not on the timeline).
		ctx.fillStyle = '#2980B9';
		for (const pin of pins) {
			ctx.beginPath();
			ctx.arc(pin.x, pin.y, 10, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	// Click drops a pin at the pointer; double-click clears. A dblclick is preceded
	// by two clicks, so defer the drop briefly and cancel it if a dblclick lands —
	// that way a double-click clears WITHOUT first dropping two pins.
	let pendingDrop: ReturnType<typeof setTimeout> | null = null;
	const drop = (e: CanvasPointerEvent) => {
		const { x, y, redraw } = e;
		if (pendingDrop) clearTimeout(pendingDrop);
		pendingDrop = setTimeout(() => {
			pendingDrop = null;
			pins = [...pins, { x, y }];
			redraw();
		}, 220);
	};
	const clear = (e: CanvasPointerEvent) => {
		if (pendingDrop) {
			clearTimeout(pendingDrop);
			pendingDrop = null;
		}
		pins = [];
		e.redraw();
	};

	// Reuse the component's interpolation for the trail (imported helper).
	import { interpAt } from '$lib/draw';
	const pathAt = (pct: number) => {
		const v = interpAt(keyframes, pct);
		return { x: v.x ?? 120, y: v.y ?? 460 };
	};
</script>

<ContentPage title="Canvas — JS Drawing on the Playhead" subtitle="A draw() callback hooked to the keyframe head: scrub it like any shape">
	<div style="line-height: 1.5em;">
		<p>
			<Label>Canvas</Label> hands you a 2D context and a
			<Label>draw(ctx, frame)</Label> callback. Give it a
			<Label>duration</Label> and it owns a hidden CSS clock, so the
			<b>ANIMATION</b> bar scrubs it like any shape. Add
			<Label>keyframes</Label> and each frame carries your value tracks
			interpolated at the playhead — here the node's <code>x/y</code>, with a
			pulse ring sized off <Label>progress</Label>. Drive it purely from the
			frame and a backward scrub retraces the path exactly. It's interactive
			too: <b>click</b> the surface to drop a pin, <b>double-click</b> to clear.
		</p>
		<QuickCode style="margin-top: 0.5em;">
			&lt;Canvas duration=&#123;5&#125; &#123;keyframes&#125; draw=&#123;(ctx, &#123; progress, values &#125;) =&gt; &#123;<br/>
			&nbsp;&nbsp;ctx.beginPath();<br/>
			&nbsp;&nbsp;ctx.arc(values.x, values.y, 20 + progress * 90, 0, 2 * Math.PI);<br/>
			&nbsp;&nbsp;ctx.stroke();<br/>
			&#125;&#125; /&gt;
		</QuickCode>
	</div>
</ContentPage>

<!-- The drawing surface, parked low to clear the title + text. The Block sets
     the canvas-px box; Canvas fills it and draws in those same coordinates. -->
<Block name="stage" x={160} y={380} width={1600} height={640}>
	<Canvas duration={5} {keyframes} draw={render} onclick={drop} ondblclick={clear} cursor="crosshair" />
</Block>

<AnimationBar startExpanded highlight />

<ViewSource {source} {path} />
