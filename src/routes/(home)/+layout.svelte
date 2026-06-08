<!--
  Landing shell (route group "(home)").

  This layout applies only to the site root `/` — the route group keeps the
  Text shell off the presentations (slides/ demo/) and the other Text artifact
  (text.html/), which bring their own layouts. The root `/` is the project's
  index/home page, built as a Text artifact (one long 1280px-wide page) so it
  shares the look and machinery of text.html. Mirrors src/routes/text.html;
  if a third Text artifact appears, factor the shell into $lib.
-->
<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/tooltip.css';

	import { setMode }   from '$lib/presentation';
	import NavigationBar from '$lib/components/NavigationBar.svelte';

	setMode('text');
</script>

<div class="text-scroll" data-text-scroll>
	<div class="text-page">
		<slot />
	</div>
</div>

<NavigationBar />

<style>
	.text-scroll {
		width: 100vw;
		height: 100vh;
		overflow: auto;
		background: #181818;
	}

	.text-page {
		width: 1280px;
		min-height: 100%;
		margin: 0 auto;
		padding: 64px 56px;
		box-sizing: border-box;
		color: #c0f1ff;
		background: #181818;
		font-family: 'Noto Sans', 'Cormorant Garamond', serif;
	}

	.text-page :global(h1) {
		font-size: 3em;
		margin: 0 0 0.2em;
		font-family: 'Playfair Display Bold', 'Cormorant Garamond', serif;
	}
	.text-page :global(h2) {
		font-size: 1.9em;
		margin: 1.6em 0 0.4em;
		font-family: 'Playfair Display Bold', 'Cormorant Garamond', serif;
	}
	.text-page :global(p),
	.text-page :global(li) {
		font-size: 1.25em;
		line-height: 1.6em;
	}
	.text-page :global(p) {
		margin: 0.8em 0;
	}
	.text-page :global(a) {
		color: #7fd9ff;
	}
</style>
