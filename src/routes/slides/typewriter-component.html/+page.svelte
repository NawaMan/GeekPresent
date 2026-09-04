<!--
  Example: Typewriter component
  File: src/routes/slides/typewriter-component.html/+page.svelte

  Terminal types inside a console; Typewriter types ordinary slide text — any font,
  wrapping like prose. The typing is CSS, so the AnimationBar on this slide scrubs
  every example here on one clock, and `startOn` holds one of them back until a named
  trigger pulses (the button, or the note line in the presenter console).
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import Typewriter   from '$lib/components/Typewriter.svelte';
	import AnimationBar from '$lib/components/AnimationBar.svelte';
	import Block        from '$lib/components/Block.svelte';
	import Note         from '$lib/components/Note.svelte';
	import Hint         from '$lib/components/Hint.svelte';
	import ViewSource   from '$lib/components/ViewSource.svelte';
	import { fireTrigger } from '$lib/stores/triggers';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/typewriter-component.html/+page.svelte';
</script>

<ContentPage title="Typewriter" subtitle="Text that types itself, one character at a time">
	<div style="max-width: 700px;">
		<p>
			<b>Typewriter</b> reveals <code>text</code> character by character — a hard cut per
			keystroke, with a caret standing where the next letter will land. Any font, and it
			wraps like the prose it is.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="svelte" code={`<Typewriter tag="h1" text="One character at a time." />

<Typewriter text={"Two lines,\\nboth typed."} charMs={40} punctuationMs={400} />`} />

		<p style="margin-top: 0.7em; opacity: 0.8;">
			Props: <code>text</code>, <code>tag</code>, <code>charMs</code>,
			<code>startMs</code> (stagger), <code>punctuationMs</code>,
			<code>caret={'{false}'}</code> (no cursor), <code>typing</code>,
			<code>startOn</code>, <code>style</code>.
		</p>
		<p style="margin-top: 0.5em; opacity: 0.8;">
			The typing is CSS, not a timer — so the <b>AnimationBar</b> below scrubs all of it,
			backwards too. The line holds its full space from the first frame, so nothing
			around it reflows as it fills.
		</p>
	</div>
</ContentPage>

<!-- The examples, each in a named Block so they can be dragged in ADJUST mode. -->
<Block name="headline" x={1000} y={230} width={840} height={110} grid={10}>
	<Typewriter tag="h2" text="One character at a time." style="font-size: 46px;" />
</Block>

<Block name="paced" x={1000} y={355} width={840} height={120} grid={10}>
	<Typewriter
		text={"It pauses, like a person writing. Then it carries on."}
		charMs={38}
		punctuationMs={450}
		startMs={1400}
		style="font-size: 30px;"
	/>
</Block>

<Block name="staggered" x={1000} y={490} width={840} height={150} grid={10}>
	<!-- Two runs on one clock: the second's `startMs` is where the first ends, so they
	     read as one hand typing two lines. No coordination beyond arithmetic. -->
	<Typewriter text={"stagger with startMs —"} charMs={45} startMs={4200} style="font-size: 30px;" />
	<Typewriter text={"the second line waits for the first."} charMs={45} startMs={5300} style="font-size: 30px;" />
</Block>

<Block name="trigger-line" x={1000} y={655} width={840} height={95} grid={10}>
	<!-- Held at frame 0 until the `punchline` pulse: the button below, or the note line
	     the speaker checks off in the presenter console. -->
	<Typewriter
		startOn="punchline"
		text={"…and this one waited to be asked."}
		charMs={55}
		startMs={0}
		style="font-size: 32px;"
	/>
</Block>

<Block name="fire-btn" x={1000} y={765} width={260} height={55} grid={10}>
	<button class="fire" on:click={() => fireTrigger('punchline')}>
		Fire trigger →
	</button>
</Block>

<!-- The two opt-outs, side by side, because they are different sizes of "less". -->

<!-- `caret={false}` drops BOTH carets — the one riding the text and the resting blink —
     and changes nothing else: the characters still land one at a time. -->
<Block name="no-caret" x={1000} y={835} width={840} height={55} grid={10}>
	<Typewriter
		text={"caret={false} — types, but no cursor"}
		caret={false}
		charMs={45}
		startMs={7200}
		style="font-size: 26px;"
	/>
</Block>

<!-- `typing={false}` drops the animation itself — and is the state every other reader
     gets for free: a `text` artifact, a handout, prerendered HTML and
     `prefers-reduced-motion` all show exactly this. -->
<Block name="static" x={1000} y={905} width={840} height={55} grid={10}>
	<Typewriter
		text={"typing={false} — printed whole"}
		typing={false}
		style="font-size: 26px; opacity: 0.75;"
	/>
</Block>

<AnimationBar />

<!-- The note the presenter console would check to fire the SAME pulse the button
     fires directly (see speaker-notes.html for where notes live). -->
<Note>
	<li data-trigger="punchline">Now let the last line type itself</li>
</Note>

<Hint text="Scrub the bar — backwards too. Flip ADJUST to drag any example." />

<ViewSource {source} {path} />

<style>
	.fire {
		width: 100%;
		height: 100%;
		font: inherit;
		font-size: 24px;
		color: var(--INK, #c0f1ff);
		background: var(--PAPER-RAISED, #1e1e1e);
		border: 1px solid color-mix(in srgb, var(--LINE, #ccc) 45%, transparent);
		border-radius: 8px;
		cursor: pointer;
	}
	.fire:hover {
		border-color: var(--ACCENT-2, #00b356);
	}
</style>
