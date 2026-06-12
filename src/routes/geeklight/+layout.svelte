<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/note.css';
	import '$lib/styles/presentation.css';
	import '$lib/styles/tooltip.css';

	// Theming: themes.css holds the base palettes (the few knobs), roles.css maps
	// the semantic role tokens onto them. The deck picks a palette with the
	// `theme-light` class on .content below — switch dark/light there in one line.
	import '$lib/themes/themes.css';
	import '$lib/themes/roles.css';

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

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);

	// Browser-tab <title>: this slide's own `title` composed with the deck name
	// ("GeekLight") into "Slide — GeekLight". Emitted as ONE <title> below (the
	// browser uses the first <title>, so it can't stack like the favicon links).
	$: currentSlide = $page.url.pathname.replace(/\/+$/, '').split('/').pop();
	$: docTitle     = documentTitle(pages.find((p) => p.path === currentSlide)?.title, 'GeekLight');

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

<svelte:head>
	<title>{docTitle}</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" />
</svelte:head>

<div class="container gp-deck theme-light" class:scale-mode={isScaled} bind:this={container}>
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
		background: var(--surface-bg);     /* themed: see themes.css (.theme-light) */
		border: 1.5px solid var(--frame-border);
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
		/* Colors come from the theme tokens (see themes.css / roles.css). The
		   watercolor sits on top, with --surface-bg behind it as the base tint. */
		color: var(--surface-fg);
		background: url('./bg.png') center / cover no-repeat, var(--surface-bg);
		font-family: 'Merriweather', Georgia, serif;
	}

	.container:not(.scale-mode) {
		/** Bookmark : Here is where we control how much the slide shift up. */
		transform: translateY(-120px);
	}

</style>
