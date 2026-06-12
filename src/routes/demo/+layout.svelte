<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/note.css';
	import '$lib/styles/presentation.css';
	import '$lib/styles/tooltip.css';

	import Copyright      from '$lib/components/Copyright.svelte';
	import TableOfContent from '$lib/components/TableOfContent.svelte';
	import SizeMode       from '$lib/components/SizeMode.svelte';

	import { browser }    from '$app/environment';
	import { page }       from '$app/stores';
	import { onMount }    from 'svelte';
	import { pages }      from './pages';
	import { setPages }   from '$lib/presentation';
	import { scaleMode }  from '$lib/stores/scaleMode';
	import { documentTitle } from '$lib/utils/navigate';

	// This presentation's own favicon, colocated in the folder.
	import favicon from './favicon.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);

	// Current slide's optional favicon (declared in pages.ts) — see <svelte:head>.
	$: currentSlide   = $page.url.pathname.replace(/\/+$/, '').split('/').pop();
	$: currentFavicon = pages.find((p) => p.path === currentSlide)?.favicon;
	// Browser-tab <title>: this slide's own `title` composed with the deck name
	// ("Demo") into "Slide — Demo". Emitted as ONE <title> below (the browser uses
	// the first <title>, so it can't stack like the favicon links). See documentTitle.
	$: docTitle       = documentTitle(pages.find((p) => p.path === currentSlide)?.title, 'Demo');

	let container: HTMLElement;
	let content:   HTMLElement;

	let   isScaled    = $scaleMode;
	let   initialized = false;
	const aspectRatio = 1920 / 1080;

	function adjustSize() {
		if (!container)
			return;

		if (!isScaled) {
			container.style.width   = '1920px';
			container.style.height  = '1080px';
			content.style.transform = `scale(1)`;
			content.style.transformOrigin = 'top left';
			return;
		}

		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		const windowRatio = windowWidth / windowHeight;

		if (windowRatio > aspectRatio) {
			container.style.height = 'calc(100vh - 10px)';
			container.style.width = `${Math.round(container.offsetHeight*aspectRatio)}px`;
		} else {
			container.style.width = 'calc(100vw - 10px)';
			container.style.height = `${Math.round(container.offsetWidth / aspectRatio)}px`;
		}
		let scale = (container.offsetWidth - 45) / 1920.0;
		content.style.transform = `scale(${scale})`;
		content.style.transformOrigin = 'top left';
	}

	onMount(() => {
		if (browser) {
			scaleMode.subscribe(value => {
				isScaled = value;

				window.removeEventListener('resize', adjustSize);
				document.body.classList.add('rendering');
				adjustSize();
				document.body.classList.remove('rendering');
				if (isScaled) {
					window.addEventListener('resize', adjustSize);
				}
			});

			initialized = true;
		}
	});

</script>

<!--
  The favicon cascade, all emitted from this (non-gated) layout head so it lands
  in the prerendered HTML — last <link rel="icon"> wins:
    1. site default        — src/app.html (rendered before %sveltekit.head%)
    2. presentation default — {favicon}, this deck's own icon (overrides the site)
    3. page override        — {currentFavicon}, the current slide's own icon from
                              pages.ts, if any (overrides the presentation)
  (Emitted here, not from each +page.svelte: this deck gates the slide <slot> on
  onMount, so a page's own <svelte:head> would only apply after hydration.)
-->
<svelte:head>
	<title>{docTitle}</title>
	<link rel="icon" href={favicon} />
	{#if currentFavicon}
		<link rel="icon" href={currentFavicon} />
	{/if}
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" />
</svelte:head>

<div class="container" class:scale-mode={isScaled} bind:this={container}>
	<div class="content"  bind:this={content}>
		{#if initialized}
		<slot />
		<TableOfContent {pages} />
		<SizeMode  />
		<Copyright />
		{/if}
	</div>
</div>

<style>
	.container {
		width: 1920px;
		height: 1080px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		background: #0c0a07;          /* demo theme: warm near-black */
		border: 1.5px solid #5a4a36;  /* demo theme: warm border */
		position: relative;
	}
	.container.scale-mode {
		width: 100%;
		height: 100%;
		max-width: 100vw;
		max-height: 100vh;
	}
	.content {
		/* Base font-size lever: the canvas grew x1.5 (1280x720 -> 1920x1080), so
		   every em-based size in the reused components scales x1.5 from here in
		   one place, instead of editing each component. px values are scaled
		   individually; %/vw/vh already track the canvas. */
		font-size: 1.5em;
		width: calc(1920px + 20px);
		height: calc(1080px - 30px);
		min-width: calc(1920px - 30px);
		min-height: calc(1080px - 30px);
		overflow: visible;
		padding: 15px;
		margin: 0px;
		display: flex;
		justify-content: center;
		align-items: center;
		/* demo theme: warm cream text, serif font, background image */
		color: #ead9b0;
		background: url('./bg.png') center / cover no-repeat;
		font-family: 'Merriweather', Georgia, serif;
	}

	.container:not(.scale-mode) {
		/** Bookmark : Here is where we control how much the slide shift up. */
		transform: translateY(-120px);
	}

</style>
