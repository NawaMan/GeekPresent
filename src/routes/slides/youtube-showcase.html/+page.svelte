<!--
  Example: YouTube component showcase
  File: src/routes/slides/youtube-showcase.html/+page.svelte

  Page assets live in this folder, right next to the page that uses them:
    onerbc-TN.png   the thumbnail   (generate with utils/prepare-youtube.sh)
    onerbc-QR.png   the QR code
  Import them so Vite bundles them, then hand them to <YouTube>.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import YouTube     from '$lib/components/YouTube.svelte';
	import thumbnail   from './onerbc-TN.png';
	import qr          from './onerbc-QR.png';
</script>

<ContentPage title="YouTube" subtitle="Thumbnail + QR code linking to a video">
	<div style="text-align: center;">
		<YouTube {thumbnail} {qr} alt="My solution for OneRBC" youtubeId="wJ8ucHyJuqg" width="600px" />
		<p style="margin-top: 1.5em; font-size: 0.9em;">
			<b>My solution for OneRBC</b> &mdash; click the thumbnail or scan the QR code to watch.
		</p>
	</div>
</ContentPage>
