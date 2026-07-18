<!--
  Hint — a faint cue pinned to the bottom of the slide.

    <Hint text="Flip ADJUST (top-right) to drag & resize any callout" />

  A Hint floats over whatever the slide happens to put behind it — an image, a
  chart, a live website — so it cannot rely on contrasting with the deck surface.
  Left as bare text it disappears the moment the pixels behind it match its colour.
  It therefore carries its OWN background: a translucent backdrop and a hairline
  rule, both mixed from the --hint-* role tokens, which give the text a legible
  surface of its own on any backdrop while staying quiet enough to read as a cue
  and not as content.

  It rests SEMI-TRANSPARENT and lifts to full opacity on hover/focus — a cue
  should recede while you read the slide and sharpen the moment you look at it —
  and it carries an (X) so a viewer can dismiss it once they've read it. A drag
  grip (like the annotate tool bar's) lets a viewer park it off whatever it lands
  on; the move lasts the life of the slide and a reload returns it home.

  Props:
    text        — the cue.
    isVisible   — false hides it entirely.
    boxed       — the backdrop + rule (default true). `false` restores the old
                  bare text, for slides that know what sits behind it.
    movable     — offer the drag grip (default true). `false` pins the cue to its
                  resting spot and hides the grip.
    dim         — resting opacity (0–1); lifts to 1 on hover/focus. Unset uses the
                  default 0.4 — faint enough to read as a cue, legible in full on
                  hover. Raise it (dim=0.85) for a slide that wants the cue louder.
    dismissible — show the (X) close button (default true). `false` hides it.
    style       — inline style for the pill, applied last so it wins: e.g.
                  `style="font-size: 0.8em"` for a quieter cue on a busy slide.

  Events:
    close       — fired when the viewer dismisses it via (X). Dismissal is also
                  self-contained: the Hint hides itself, no binding required. It
                  stays dismissed for the life of the slide (each slide is its own
                  page load), so no reset is offered.
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { trackPointer } from '$lib/utils/drag';

	export let text = '-hint-';
	export let isVisible = true;
	/** Draw the translucent backdrop + rule behind the text. */
	export let boxed = true;
	/** Offer the drag grip so a viewer can park the cue off whatever it lands on — the
	    same affordance the annotate tool bar has. On by default; `movable={false}` pins
	    it to its resting spot (bottom-centre) and hides the grip. */
	export let movable = true;
	/** Resting opacity (0–1); lifts to 1 on hover/focus. Unset → the mode default. */
	export let dim: number | null = null;
	/** Show the (X) close button. */
	export let dismissible = true;
	/** Inline style for the pill — the same escape hatch Callout and QuickCode offer.
	    Appended LAST, so it beats both the component's own rules (a plain declaration
	    on the element outranks any class selector) and `dim`'s custom property: a slide
	    that wants a smaller or narrower cue writes `style="font-size: 0.8em"` and gets
	    it. Without this prop the attribute was silently dropped — a Svelte component
	    forwards nothing it has not declared. */
	export let style = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. NOTE: a slide's own style block is scoped, so a
	    class defined there will NOT match — use global CSS (global.css / roles.css / a
	    :global(...) block) or a utility class. See AGENTS.md. */
	let klass: string = '';
	export { klass as class };

	const dispatch = createEventDispatcher<{ close: void }>();
	// Own dismissal, so a bare <Hint/> closes without any binding. ANDed with the
	// isVisible prop below, never written back to it.
	let open = true;

	// `dim` rides an inherited custom property the opacity rules read, with a 0.4
	// fallback — so unset it rests semi-transparent, and setting it moves the rest
	// state. Hover/focus overrides it to 1 regardless. Junk (NaN/±∞) falls back too.
	$: dimVar =
		dim == null || !Number.isFinite(dim)
			? ''
			: `--hint-dim:${Math.min(1, Math.max(0, dim))};`;

	function close() {
		open = false;
		dispatch('close');
	}

	// ── Dragging the cue ────────────────────────────────────────────────────────────────
	// Like the annotate tool bar, the cue floats over whatever the slide put behind it, so
	// wherever it defaults to it is in someone's way. It moves by a GRIP (a pill you drag by
	// its face is a pill whose close button you can't press), and double-clicking the grip
	// sends it home.
	//
	// The move is a TRANSLATE from the resting spot, not an absolute canvas coordinate: the
	// cue is absolutely positioned inside SlideDeck's transform-scaled `.content`, so a
	// translate in canvas px rides that same scale for free — no need to know the canvas
	// origin or unpick `.content`'s padding. Unlike the annotate bar this is NOT persisted:
	// the cue is already ephemeral (dismissal lasts only the life of the slide), so a reload
	// returns it home, same as everything else about it.
	let root: HTMLDivElement;
	let offset = { x: 0, y: 0 }; // canvas-px shift from the resting position
	$: moved = offset.x !== 0 || offset.y !== 0;

	function onGripDown(ev: PointerEvent) {
		if (ev.button !== 0) return;
		ev.preventDefault();
		ev.stopPropagation(); // the grip's gesture is a drag, never a text-selection on the pill

		const rootRect = root.getBoundingClientRect();
		const frame = root.closest('.content')?.getBoundingClientRect();
		// Screen px per canvas px, right now, in whatever display mode is in force.
		const scale = root.offsetWidth ? rootRect.width / root.offsetWidth : 1;
		// How far the cue may travel each way (canvas px) before its edge leaves the frame —
		// so a drag can't fling it off-screen and out of reach (double-click still homes it).
		const roomL = frame ? (rootRect.left - frame.left) / scale : Infinity;
		const roomR = frame ? (frame.right - rootRect.right) / scale : Infinity;
		const roomU = frame ? (rootRect.top - frame.top) / scale : Infinity;
		const roomD = frame ? (frame.bottom - rootRect.bottom) / scale : Infinity;
		const start = offset;

		trackPointer(ev, {
			scaleFrom: root,
			onMove: (dx, dy) => {
				offset = {
					x: start.x + Math.max(-roomL, Math.min(roomR, dx)),
					y: start.y + Math.max(-roomU, Math.min(roomD, dy))
				};
			},
			// Esc mid-drag puts it back where it was, like every other gesture in the deck.
			onCancel: () => (offset = start)
		});
	}

	/** Double-click the grip to send the cue back to its resting spot. */
	function homeHint() {
		offset = { x: 0, y: 0 };
	}
</script>

<div
	class="text {klass}"
	class:hidden={!isVisible || !open}
	class:boxed
	class:movable
	bind:this={root}
	id={id || undefined}
	style="{dimVar}{moved ? `transform: translate(${offset.x}px, ${offset.y}px);` : ''}{style}"
>
	{#if movable}
		<!-- Drag by the GRIP, not by the pill's face; double-click sends it home. Rides the
		     group's rest-opacity like the rest of the cue, so it's a quiet affordance until
		     you point at the hint. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			class="grip"
			role="button"
			tabindex="-1"
			aria-label="Move the hint"
			title="Drag to move · double-click to reset"
			on:pointerdown={onGripDown}
			on:dblclick={homeHint}
		>⠿</span>
	{/if}
	<span class="label">{text}</span>
	{#if dismissible}
		<button class="close" type="button" aria-label="Dismiss hint" on:click={close}>
			<span aria-hidden="true">×</span>
		</button>
	{/if}
</div>

<style>
	/* Centred by its STATIC POSITION, not by margins. An absolutely positioned box
	   with `left`/`right` both auto is placed where it would have sat in flow — and
	   a Hint's flow parent is SlideDeck's `.content`, a flex container with
	   `justify-content: center`, so the pill lands on the canvas's centre line.
	   (`.content` is also transform-scaled, which makes it the containing block.)
	   `margin: auto` used to sit here and did nothing: per CSS 2.1 §10.3.7, when
	   left, width and right are all auto the auto margins are first set to 0. */
	.text {
		/* cosmetic */
		position: absolute;
		padding-left: 0.5em;
		padding-right: 0.5em;
		/* Lifted to sit JUST ABOVE the window-fixed ControlBar's resting peek (the bottom-centre
		   nav pill auto-hides down to a ~40% strip until hovered; it lives at z-index 50 in
		   SlideDeck's overlay, over the slide's own centre line, and would otherwise bury a
		   centred cue). The cue and the bar are in different coordinate systems — the cue scales
		   with the canvas, the bar stays a constant window size — so there is no scale-exact
		   seam in CSS: this is an em value tuned to land the cue flush over the peek at
		   presentation scale. Was 0px, flush to the canvas floor. */
		bottom: 1.8em;
		/* Paint ABOVE the bottom-right Copyright, which is a later DOM sibling in
		   SlideDeck's `.content` and so would otherwise write over a wide, centred cue.
		   A positive z-index beats the copyright's `auto`, so the cue stays legible and
		   the copyright reads as sitting behind it. */
		z-index: 2;
		/* 1.1em of .content's 24px --base-font → ~26px bold — quiet enough for a
		   cue, still large-text for WCAG's 3:1 bar. Was 1.5em (36px); slides that
		   wanted the quieter size had been overriding with style="font-size:1.1em". */
		font-size: 1.1em;
		font-weight: bold;
		/* Rests semi-transparent (0.4), sharpens to full on hover/focus below.
		   `--hint-dim` (from the `dim` prop) overrides the rest value when set. */
		opacity: var(--hint-dim, 0.4);
		transition: opacity 0.15s ease;
	}

	/* Lift to full opacity when pointed at OR when the close button takes focus
	   (keyboard reveal, the deck's :focus-within chrome convention). Full opacity
	   only raises the verified contrast, never lowers it. */
	.text:hover,
	.text:focus-within {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.text {
			transition: none;
		}
	}

	/* The backdrop is what makes the cue readable over arbitrary pixels. Both the
	   fill and the rule mix toward `transparent`, so neither needs to know the
	   colour of the surface it lands on — they just pull it toward the theme's own
	   --BACKDROP (deepening it under a dark theme, lightening it under a light one,
	   which is what keeps --hint-fg legible either way).

	   The pill inherits the group's rest opacity (0.4 by default), so `opacity` is a
	   GROUP opacity here: it multiplies the 62% fill and 28% rule down before either
	   lands on the backdrop. At rest the composite text-on-pill is a deliberately
	   faint ~2.3:1 (worst case, over black) — a cue, not content. Hover/focus lifts
	   the group to full, where the composite reaches >= 4.1:1: AA for the ~26px bold
	   this renders at (large text), over every backdrop in the deck (letterbox,
	   terminal, QR plate, chart). Faint until looked at, fully legible the moment
	   it is. */
	.text.boxed {
		bottom: 1em;
		padding: 0.15em 0.7em;
		border-radius: 999px;
		color: var(--hint-fg, #C0F1FF);
		background: color-mix(in srgb, var(--hint-bg, #000000) 62%, transparent);
		border: 1px solid color-mix(in srgb, var(--hint-border, #C0F1FF) 28%, transparent);
	}

	/* The (X): a corner badge, ABSOLUTELY positioned so it never widens the pill —
	   the pill's size (and thus the contrast measured on it) is untouched. It sits
	   just off the top-right, overlapping the rounded corner's empty space. It
	   rides the group's rest-opacity like the text, so it's a quiet affordance
	   until you point at the hint, then it's fully there to click.

	   Shaped to match the annotate tool bar's own close (.annot-close): a clean round
	   button with a transparent rest border that fills on hover, and the glyph nudged
	   up for optical centring — so the two dismiss buttons read as the same control.
	   It keeps a translucent backdrop of its own (the annotate bar sits on an opaque
	   pill; this one floats over arbitrary slide pixels and would vanish without it). */
	.close {
		position: absolute;
		top: -0.55em;
		right: -0.5em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7em;
		height: 1.7em;
		padding: 0;
		font-size: 0.85em;
		line-height: 1;
		border-radius: 50%;
		cursor: pointer;
		color: var(--hint-fg, #C0F1FF);
		/* Denser than the pill so the badge reads as its own thing on any backdrop,
		   mixed toward --BACKDROP like the pill so it needn't know the surface. */
		background: color-mix(in srgb, var(--hint-bg, #000000) 85%, transparent);
		border: 1px solid transparent;
	}
	.close:hover,
	.close:focus-visible {
		background: var(--hint-bg, #000000);
		border-color: var(--hint-border, #C0F1FF);
	}
	/* Optical-centre the × in its circle, exactly as .annot-close does. */
	.close span {
		display: block;
		transform: translateY(-0.06em);
	}

	/* The drag grip — the dotted handle the cue is moved by, styled like the annotate tool
	   bar's own grip (.annot-grip) so the two read as the same affordance. It rides the
	   group's rest-opacity with the rest of the cue; `touch-action: none` keeps a drag over
	   it from also scrolling or selecting on a touch screen. */
	.grip {
		cursor: grab;
		user-select: none;
		touch-action: none;
		margin-right: 0.35em;
		font-size: 0.9em;
		line-height: 1;
		color: var(--hint-fg, #C0F1FF);
		opacity: 0.65;
	}
	.grip:hover {
		opacity: 1;
	}
	.grip:active {
		cursor: grabbing;
	}

	.text.hidden {
		display: none;
	}
</style>
