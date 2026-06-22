<!--
  Outro slide for the Scaling Calibration test deck.
  File: src/routes/tests/thank-you.html/+page.svelte
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">Done</span>
	<span slot="subtitle">Send me the captured calibration image</span>
	<span slot="subsubtitle">if the X hits the corners and the magenta frame is a uniform 10px,
		the view scale is correct<br/>
		<a href="../" style="opacity: 0.85;">↑ back to the home page</a></span>
</TitlePage>
