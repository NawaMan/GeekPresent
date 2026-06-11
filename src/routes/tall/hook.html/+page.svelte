<!--
  Portrait content slide using the shared ContentPage template. Keep it short and
  punchy — a Tall slide is read in a couple of seconds on a phone. The colocated
  frame.svg is imported below so Vite bundles and hashes it.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import frame       from './frame.svg';
</script>

<ContentPage title="Same deck." subtitle="Taller frame.">
	<p>
		One number changes:<br/>
		<b>1080&times;1920</b>.
	</p>

	<img src={frame} alt="The same deck, reframed from a wide 1920x1080 canvas to a tall 1080x1920 portrait frame." />

	<p>Same components. Same templates. Same words.</p>
	<p>Big text. Few of them. Made for a phone.</p>

	<style>
		img {
			display: block;
			width: 100%;
			/* Size knob: keep the diagram modest so the text still leads. */
			max-width: 760px;
			margin: 0.8em auto;
		}
	</style>
</ContentPage>
