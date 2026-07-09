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

  Props:
    text      — the cue.
    isVisible — false hides it entirely.
    boxed     — the backdrop + rule (default true). `false` restores the old bare
                text, for slides that know what sits behind it.
-->
<script lang="ts">
	export let text = '-hint-';
	export let isVisible = true;
	/** Draw the translucent backdrop + rule behind the text. */
	export let boxed = true;
</script>

<div class="text" class:hidden={!isVisible} class:boxed>{text}</div>

<style>
	.text {
		/* cosmetic */
		position: absolute;
		padding-left: 0.5em;
		padding-right: 0.5em;
		bottom: 0px;
		margin-right: auto;
		margin-left: auto;
		font-size: 1.5em;
		font-weight: bold;
		opacity: 0.7;
	}

	/* The backdrop is what makes the cue readable over arbitrary pixels. Both the
	   fill and the rule mix toward `transparent`, so neither needs to know the
	   colour of the surface it lands on — they just deepen it. Raised opacity vs.
	   the bare variant: the box already does the receding, so the text itself no
	   longer has to be washed out to read as a cue. */
	.text.boxed {
		bottom: 6px;
		padding: 0.15em 0.7em;
		border-radius: 999px;
		color: var(--hint-fg, #C0F1FF);
		background: color-mix(in srgb, var(--hint-bg, #000000) 62%, transparent);
		border: 1px solid color-mix(in srgb, var(--hint-border, #C0F1FF) 28%, transparent);
		opacity: 0.9;
	}

	.text.hidden {
		display: none;
	}
</style>
