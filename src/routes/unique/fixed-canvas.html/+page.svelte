<!--
  Unique #2: Fixed canvas, pixel-exact positioning, auto-scaling
  File: src/routes/unique/fixed-canvas.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="A fixed canvas, scaled for you" subtitle="Pixel-exact positioning — and the framework does the scaling math">
	<p>
		You design against one fixed <b>1920&times;1080</b> canvas, so an exact pixel means
		the same thing on every screen:
	</p>
	<QuickCode>
		&lt;div style="position: absolute; <b>left: 960px; top: 540px;</b>"&gt;dead center&lt;/div&gt;
	</QuickCode>
	<ul style="margin-top: 0.6em;">
		<li>
			Most HTML-slide tools push you toward <b>responsive flow</b> &mdash; layouts
			shift as the window changes.
		</li>
		<li>Here you get a <b>fixed coordinate space</b> instead.</li>
		<li>
			The framework <b>scales the whole canvas</b> to fit any screen, keeping the
			16:9 ratio.
		</li>
		<li>You think in <b>one size</b>; it handles the rest.</li>
	</ul>
</ContentPage>

<!-- A demonstration: this dot is pinned at an exact pixel and rides the scaling. -->
<div style="position: absolute; right: 64px; top: 280px; text-align: center; opacity: 0.85;">
	<div style="width: 16px; height: 16px; border-radius: 50%; background: #F0A33E; margin: 0 auto;"></div>
	<div style="font-size: 0.7em; margin-top: 4px;">pinned at<br/>an exact px</div>
</div>

<Hint text="Resize the window — the whole slide scales, and the layout never breaks" />
