<!--
  Example: Authoring @keyframes WITH LAYOUT mode, via the reusable KeyframeStudio.
  File: src/routes/slides/keyframe-studio.html/+page.svelte

  All the machinery — ghost <Block>s per stop, the live preview, the draggable
  stop-editor panel, the <AnimationBar/> and the Copy button — now lives in
  <KeyframeStudio/>. This slide just supplies the moving element (🚀), its start
  poses, and the playback time; drop the same component on any other slide to get
  the whole authoring loop there too.

    1. Open this slide with `?layout` (or toggle LAYOUT, top-right, in dev).
    2. Drag a ghost to move that stop, or swing its grip to rotate it; the animation
       re-resolves immediately.
    3. In the panel: edit a stop's % and l/t/w/h/r, "+ keyframe", ✕ to remove, set time.
    4. Scrub the AnimationBar, then COPY the @keyframes.

  WHY POSITIONS, BUT NOT TIME/EASING: the stop %s are relative to the total, so
  they're duration-independent — keep duration + easing in your own `animation:`
  rule (and any non-geometry track like color in a separate @keyframes). The copy
  only ever carries positions.
-->
<script>
	import ContentPage    from '$lib/templates/ContentPage.svelte';
	import QuickCode       from '$lib/components/QuickCode.svelte';
	import KeyframeStudio  from '$lib/components/KeyframeStudio.svelte';
	import ViewSource      from '$lib/components/ViewSource.svelte';
	import source         from './+page.svelte?raw';

	const path = 'src/routes/slides/keyframe-studio.html/+page.svelte';

	// Start poses for the rocket — KeyframeStudio clones these and owns the rest. Five
	// stops with a rotation flourish: it climbs nose-up (20→26°), then banks hard the
	// other way (-48°) and settles at -45°. (font-size is derived from h × fontScale.)
	const stops = [
		{ pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20  },
		{ pct: 50,  x: 950,  y: 437, w: 142, h: 137, rot: 26  },
		{ pct: 75,  x: 1419, y: 307, w: 191, h: 200, rot: 24  },
		{ pct: 85,  x: 1531, y: 246, w: 215, h: 212, rot: -48 },
		{ pct: 100, x: 1528, y: 432, w: 228, h: 219, rot: -45 },
	];
</script>

<ContentPage title="Keyframe Studio" subtitle="Drag, rotate, add/remove stops & set the time — live">
	<div style="line-height: 1.5em;">
		<p>
			The rocket flies through a row of faint <b>ghost</b> stops. Flip
			<b>LAYOUT</b> on, drag a ghost to move that stop or swing its <b>grip</b> to
			rotate it, then in the panel fine-tune each stop's <code>%</code> and
			<code>l/t/w/h/r</code>, <b>+&nbsp;keyframe</b> to add one, <b>✕</b> to remove,
			and set the overall <b>time</b>. The <code>@keyframes</code> rebuild live:
		</p>
		<QuickCode style="margin-top: 0.5em;">
			@keyframes fly &#123;<br/>
			&nbsp;&nbsp;0%&nbsp;&nbsp; &#123; left: …; top: …; transform: rotate(20deg); … &#125;<br/>
			&nbsp;&nbsp;50%&nbsp; &#123; left: …; top: …; transform: rotate(26deg); … &#125;<br/>
			&nbsp;&nbsp;…<br/>
			&nbsp;&nbsp;100% &#123; left: …; top: …; transform: rotate(-45deg); … &#125;<br/>
			&#125;
		</QuickCode>
		<p style="margin-top: 0.6em; opacity: 0.8;">
			This whole tool is one reusable <code>&lt;KeyframeStudio/&gt;</code> &mdash;
			drop it on any slide. Nothing is saved; it's a preview. <b>Time &amp; easing
			aren't here on purpose</b>: keep timing in your own <code>animation:</code>
			rule. <b>Copy</b> grabs positions only.
		</p>
	</div>
</ContentPage>

<!-- The whole authoring loop: ghosts + preview + panel + AnimationBar + Copy.
     fontScale grows the 🚀 glyph with its box as it travels. -->
<KeyframeStudio name="fly" initialStops={stops} duration={2.5} fontScale={0.84}>🚀</KeyframeStudio>

<ViewSource {source} {path} />
