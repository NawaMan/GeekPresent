<!--
  Block — an absolutely-positioned, editable wrapper in CANVAS pixels.

  Drop it around any slide content to pin that content at exact (x, y) with a
  fixed (width, height) in the deck's fixed coordinate space (1920x1080 landscape
  by default). Because SlideDeck scales the whole canvas with one CSS transform,
  these coordinates are authored once and scale with the slide in every display
  mode — no per-element math.

      <Block x={120} y={240} width={400} height={160} name="hero">
          <h2>Pinned content</h2>
      </Block>

  When LAYOUT mode is ON, the wrapper grows a drag body + a bottom-right
  resize handle + a small toolbar. Dragging updates x/y/width/height live; the
  COPY button writes an updated <Block .../> snippet to the clipboard so you can
  paste the new geometry back into the page source. (Snippet-emit, not live source
  rewrite: what you copy is the element's own current props — robust and decoupled
  from how the page text is laid out.)

  The drag math divides screen-pixel pointer deltas by the element's LIVE rendered
  scale (getBoundingClientRect().width / offsetWidth), so a drag tracks the cursor
  1:1 whether the deck is FITTED (fit-to-window) or SCALED to any zoom factor.
-->
<script lang="ts">
	import { layoutMode, canLayout } from '$lib/stores/layoutMode';
	import { record } from '$lib/stores/layoutHistory';

	// Editing affordances only when the LAYOUT control is BOTH available (dev or an
	// opted-in `?layout` session) and switched on. canLayout keeps the published
	// deck inert even if a stale layoutMode=true lingers in localStorage.
	$: editing = $canLayout && $layoutMode;

	/** Top-left position and size, in canvas pixels. */
	export let x = 0;
	export let y = 0;
	export let width = 200;
	export let height = 120;
	/** Optional label, shown in edit mode and used in the copied snippet's comment. */
	export let name = '';
	/** Snap step (canvas px) while dragging/resizing. 1 = freeform. */
	export let grid = 1;
	/** Lock the width:height ratio while resizing. A number sets an explicit ratio
	    (e.g. 16/9); `true` locks to the element's current shape at the drag's start;
	    `false`/null resizes freeform. Hold Alt while resizing to break the lock and
	    change the ratio freely. */
	export let aspect: number | boolean | null = null;
	/** Canvas bounds used to clamp dragging. Match the deck's width/height. */
	export let canvasWidth = 1920;
	export let canvasHeight = 1080;
	/** Where the element may go. 'canvas' (default) keeps it fully inside the
	    canvas; 'none' lets you drag/resize it past the edges — off-stage or bleeding
	    over an edge. (Undo/Ctrl+Z gets it back if it goes fully out of reach.) */
	export let bounds: 'canvas' | 'none' = 'canvas';
	/** Smallest size you can resize down to. */
	export let minSize = 24;
	/** Snippet shape for the Copy button. A wrapper (e.g. ImageBlock) overrides
	    `tag` + `attrs` so Copy emits ITS tag, not the inner Block. `attrs` is a
	    pre-rendered attribute string (with a leading space); `selfClose` emits
	    `<Tag ... />` instead of an open/close pair with a slot placeholder. */
	export let tag = 'Block';
	export let attrs = '';
	export let selfClose = false;

	let el: HTMLElement;
	let copied = false;

	const snap = (n: number) => (grid > 1 ? Math.round(n / grid) * grid : Math.round(n));
	const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

	// One pointer gesture, parameterised by which corner(s) it moves. `move` shifts
	// x/y; `size` grows width/height. Both at once = a drag; size-only = resize.
	type Mode = 'move' | 'size';
	let dragging: Mode | null = null;

	function startDrag(mode: Mode, event: PointerEvent) {
		if (!editing) return;
		event.preventDefault();
		event.stopPropagation();
		dragging = mode;

		// Live scale: how many screen px equal one canvas px right now. Works in any
		// display mode because it measures the element as actually painted.
		const scale = el.getBoundingClientRect().width / el.offsetWidth || 1;
		const startPX = event.clientX;
		const startPY = event.clientY;
		const startX = x;
		const startY = y;
		const startW = width;
		const startH = height;
		// Ratio to hold while resizing: explicit number, or the current shape when
		// `aspect` is `true`. null = freeform.
		const ratio = typeof aspect === 'number' ? aspect : aspect === true ? startW / startH : null;

		const free = bounds === 'none';
		const onMove = (e: PointerEvent) => {
			const dx = (e.clientX - startPX) / scale;
			const dy = (e.clientY - startPY) / scale;
			if (mode === 'move') {
				x = snap(free ? startX + dx : clamp(startX + dx, 0, canvasWidth - width));
				y = snap(free ? startY + dy : clamp(startY + dy, 0, canvasHeight - height));
			} else if (ratio && !e.altKey) {
				// Aspect-locked: drive from the axis the pointer moved most, derive the
				// other from `ratio`, then clamp to canvas + minSize without skewing —
				// whichever bound binds first wins and the partner follows the ratio.
				// Hold Alt to break the lock and resize freeform (see the else below).
				let w, h;
				if (Math.abs(dx) >= Math.abs(dy)) {
					w = startW + dx;
					h = w / ratio;
				} else {
					h = startH + dy;
					w = h * ratio;
				}
				if (w < minSize) { w = minSize; h = w / ratio; }
				if (h < minSize) { h = minSize; w = h * ratio; }
				if (!free && x + w > canvasWidth)  { w = canvasWidth  - x; h = w / ratio; }
				if (!free && y + h > canvasHeight) { h = canvasHeight - y; w = h * ratio; }
				width  = snap(w);
				height = snap(h);
			} else {
				width = clamp(snap(startW + dx), minSize, free ? Infinity : canvasWidth - x);
				height = clamp(snap(startH + dy), minSize, free ? Infinity : canvasHeight - y);
			}
		};
		const target = event.target as Element;
		const pid = event.pointerId;
		function end() {
			dragging = null;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('keydown', onKey, true);
			target?.releasePointerCapture?.(pid);
		}
		// On commit, record the net change (before → after) for global undo/redo —
		// but only if the gesture actually moved something, so a stray click that
		// doesn't drag never clutters the history.
		const onUp = () => {
			end();
			const before = { x: startX, y: startY, w: startW, h: startH };
			const after = { x, y, w: width, h: height };
			if (before.x === after.x && before.y === after.y && before.w === after.w && before.h === after.h) return;
			record({
				undo: () => { x = before.x; y = before.y; width = before.w; height = before.h; },
				redo: () => { x = after.x;  y = after.y;  width = after.w;  height = after.h; },
			});
		};
		// Esc cancels the in-progress gesture: snap every value back to where it was
		// when the drag began. Captured (useCapture) + stopped so it doesn't also
		// trip an ancestor's Escape handler (e.g. a Box close).
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== 'Escape') return;
			e.preventDefault();
			e.stopPropagation();
			x = startX; y = startY; width = startW; height = startH;
			end();
		};
		target.setPointerCapture?.(pid);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('keydown', onKey, true);
	}

	// When NOT editing, a bounds="none" element that bleeds past the canvas should
	// look clipped to the canvas edge (the "stage"), not spill into the letterbox.
	// Clip just THIS element to the canvas rectangle, computed in its own local
	// coords (local L maps to canvas x+L, so the visible band is -x … canvasWidth-x).
	// While editing, no clip — the off-stage part (and its handles) stays grabbable.
	$: clipPath =
		!editing && bounds === 'none'
			? `inset(${Math.max(0, -y)}px ${Math.max(0, x + width - canvasWidth)}px` +
			  ` ${Math.max(0, y + height - canvasHeight)}px ${Math.max(0, -x)}px)`
			: 'none';

	$: aspectAttr = typeof aspect === 'number' ? ` aspect={${aspect}}` : aspect === true ? ' aspect' : '';
	$: openTag =
		`<${tag}${name ? ` name="${name}"` : ''}${attrs} x={${Math.round(x)}} y={${Math.round(y)}}` +
		` width={${Math.round(width)}} height={${Math.round(height)}}${aspectAttr}`;
	$: snippet = selfClose ? `${openTag} />` : `${openTag}>\n  <!-- ... -->\n</${tag}>`;

	async function copy() {
		try {
			await navigator.clipboard.writeText(snippet);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			// Clipboard blocked (insecure context / permission) — fall back to a prompt
			// so the author can still grab the text by hand.
			window.prompt('Copy this snippet:', snippet);
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions a11y-no-noninteractive-element-interactions -->
<div
	class="movable"
	class:editing={editing}
	class:active={dragging}
	bind:this={el}
	style="left:{x}px; top:{y}px; width:{width}px; height:{height}px; clip-path:{clipPath};"
	on:pointerdown={(e) => startDrag('move', e)}
>
	<slot />

	{#if editing}
		<div class="readout">
			{name ? name + ' · ' : ''}{Math.round(x)},{Math.round(y)} · {Math.round(width)}×{Math.round(height)}
		</div>
		<button class="copy" type="button" on:pointerdown|stopPropagation on:click|stopPropagation={copy}>
			{copied ? 'Copied!' : 'Copy'}
		</button>
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div class="handle" on:pointerdown={(e) => startDrag('size', e)}></div>
	{/if}
</div>

<style>
	.movable {
		position: absolute;
		box-sizing: border-box;
	}
	/* In edit mode the wrapper becomes a manipulable object: a dashed outline marks
	   its bounds, the body is a move target, and text selection is suppressed so a
	   drag never turns into a text highlight. */
	.movable.editing {
		outline: 1.5px dashed var(--ctrl-strong-bg, #2980b9);
		outline-offset: 2px;
		cursor: move;
		user-select: none;
		touch-action: none;
	}
	.movable.active {
		outline-style: solid;
	}

	.movable .readout {
		position: absolute;
		left: 0;
		top: -1.7em;
		font-size: 0.55em;
		font-family: 'Fira Code', monospace;
		white-space: nowrap;
		padding: 0 0.4em;
		background: var(--ctrl-strong-bg, #2980b9);
		color: var(--on-accent, #ffffff);
		border-radius: 3px;
		pointer-events: none;
	}

	.movable .copy {
		position: absolute;
		right: 0;
		top: -1.7em;
		font-size: 0.55em;
		font-weight: bold;
		cursor: pointer;
		padding: 0.1em 0.6em;
		border: 0;
		border-radius: 3px;
		background: var(--ctrl-selected-bg, #00b356);
		color: var(--on-accent, #ffffff);
	}

	/* Bottom-right resize grip. */
	.movable .handle {
		position: absolute;
		right: -6px;
		bottom: -6px;
		width: 14px;
		height: 14px;
		border-radius: 3px;
		background: var(--ctrl-strong-bg, #2980b9);
		border: 1.5px solid var(--on-accent, #ffffff);
		cursor: nwse-resize;
		touch-action: none;
	}
</style>
