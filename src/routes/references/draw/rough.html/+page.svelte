<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="Rough" subtitle="The hand-drawn render option">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			A render option on the whole Draw family — wobbled, doubled strokes, boxes
			with overshooting corners, hatched fills. Set it on <code>&lt;Draw&gt;</code>
			and everything inside inherits; a shape overrides with its own
			<code>rough</code>, or opts out with <code>rough={'{false}'}</code>. Geometry,
			ADJUST handles, Copy, draw-on and keyframes are unaffected: only the
			painting changes.
		</p>

		<QuickCode
			style="margin-top: 0.7em;"
			lang="svelte"
			code={`<Draw title="Sketch" rough>
  <Rect x={40} y={40} width={200} height={120} fill="#2b6cb0" />
  <Line from={[0,0]} to={[300,0]} arrow="end" rough={1.6} />
  <Ellipse ... fillStyle="cross-hatch" hachureGap={14} />
  <Line ... rough={false} />   <!-- stays crisp -->
</Draw>`}
		/>

		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>rough</code> — <code>true</code>, or an amount (~0.5 gentle, 2 drunk)</li>
			<li><code>seed</code> — fix the wobble; omit and it derives from the shape</li>
			<li><code>fillStyle</code> — <code>hachure</code> (default) / <code>cross-hatch</code> / <code>solid</code></li>
			<li><code>hachureGap</code> / <code>hachureAngle</code> — fill spacing and direction</li>
			<li><code>--draw-font-family</code> — the hand-lettered label face</li>
		</ul>
	</div>
</ContentPage>
