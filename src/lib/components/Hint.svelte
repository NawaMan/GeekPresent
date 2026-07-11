<!--
  Hint — a faint cue pinned to the bottom of the slide.

    <Hint text="Flip LAYOUT (top-right) to drag & resize any callout" />

  A Hint floats over whatever the slide happens to put behind it — an image, a
  chart, a live website — so it cannot rely on contrasting with the deck surface.
  Left as bare text it disappears the moment the pixels behind it match its colour.
  It therefore carries its OWN background: a translucent backdrop and a hairline
  rule, both mixed from the --hint-* role tokens, which give the text a legible
  surface of its own on any backdrop while staying quiet enough to read as a cue
  and not as content.

  It rests SEMI-TRANSPARENT and lifts to full opacity on hover/focus — a cue
  should recede while you read the slide and sharpen the moment you look at it —
  and it carries an (X) so a viewer can dismiss it once they've read it.

  Props:
    text        — the cue.
    isVisible   — false hides it entirely.
    boxed       — the backdrop + rule (default true). `false` restores the old
                  bare text, for slides that know what sits behind it.
    dim         — resting opacity (0–1); lifts to 1 on hover/focus. Unset uses the
                  default 0.4 — faint enough to read as a cue, legible in full on
                  hover. Raise it (dim=0.85) for a slide that wants the cue louder.
    dismissible — show the (X) close button (default true). `false` hides it.

  Events:
    close       — fired when the viewer dismisses it via (X). Dismissal is also
                  self-contained: the Hint hides itself, no binding required. It
                  stays dismissed for the life of the slide (each slide is its own
                  page load), so no reset is offered.
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let text = '-hint-';
	export let isVisible = true;
	/** Draw the translucent backdrop + rule behind the text. */
	export let boxed = true;
	/** Resting opacity (0–1); lifts to 1 on hover/focus. Unset → the mode default. */
	export let dim: number | null = null;
	/** Show the (X) close button. */
	export let dismissible = true;

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
</script>

<div class="text" class:hidden={!isVisible || !open} class:boxed style={dimVar}>
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
		bottom: 0px;
		/* Paint ABOVE the bottom-right Copyright, which is a later DOM sibling in
		   SlideDeck's `.content` and so would otherwise write over a wide, centred cue.
		   A positive z-index beats the copyright's `auto`, so the cue stays legible and
		   the copyright reads as sitting behind it. */
		z-index: 2;
		font-size: 1.5em;
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
	   the group to full, where the composite reaches >= 4.1:1: AA for the 36px bold
	   this renders at, over every backdrop in the deck (letterbox, terminal, QR
	   plate, chart). Faint until looked at, fully legible the moment it is. */
	.text.boxed {
		bottom: 6px;
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
	   until you point at the hint, then it's fully there to click. */
	.close {
		position: absolute;
		top: -0.4em;
		right: -0.35em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25em;
		height: 1.25em;
		padding: 0;
		font-size: 0.72em;
		line-height: 1;
		border-radius: 50%;
		cursor: pointer;
		color: var(--hint-fg, #C0F1FF);
		/* Denser than the pill so the badge reads as its own thing on any backdrop,
		   mixed toward --BACKDROP like the pill so it needn't know the surface. */
		background: color-mix(in srgb, var(--hint-bg, #000000) 85%, transparent);
		border: 1px solid color-mix(in srgb, var(--hint-border, #C0F1FF) 45%, transparent);
	}
	.close:hover,
	.close:focus-visible {
		background: var(--hint-bg, #000000);
		border-color: var(--hint-border, #C0F1FF);
	}

	.text.hidden {
		display: none;
	}
</style>
