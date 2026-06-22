<!--
  How-to slide for the Scaling Calibration test deck.
  File: src/routes/tests/how-to.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="How To Use This" subtitle="Capture → measure → compare">
	<ol style="line-height: 1.5em;">
		<li>Open the next slide (the <strong>1920&times;1080 target</strong>) in <strong>FITTED</strong> mode (fit to window).</li>
		<li>Maximise the window &mdash; ideally also try a window that is <em>not</em> 16:9
			(wide-and-short, or narrow-and-tall) to stress the opposite binding axis.</li>
		<li>Take a screenshot of the slide and open it in GIMP.</li>
		<li>Measure and check:
			<ul style="margin-top: 0.3em;">
				<li>the <span style="color:#FF00AA;">magenta&nbsp;10px frame</span> hugs the canvas edge,
					just inside the thin grey deck frame, and is the same thickness on all four sides;</li>
				<li>the <span style="color:#00E5FF;">cyan X</span> meets exactly at the four corners (nothing clipped or offset);</li>
				<li>the target rectangle measures <strong>16:9</strong> (no horizontal/vertical stretch);</li>
				<li>captured&nbsp;border&nbsp;&divide;&nbsp;captured&nbsp;width = 10&nbsp;&divide;&nbsp;1920&nbsp;(&asymp;&nbsp;0.52%).</li>
			</ul>
		</li>
	</ol>
	<p style="margin-top: 0.6em; opacity: 0.8;">If the X misses a corner or the rectangle is not 16:9, the scale is off &mdash; send me the image.</p>
</ContentPage>
