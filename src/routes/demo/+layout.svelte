<script lang="ts">
	import '$lib/styles/global.css';
	import '$lib/styles/note.css';
	import '$lib/styles/presentation.css';
	import '$lib/styles/tooltip.css';

	import Copyright      from '$lib/components/Copyright.svelte';
	import TableOfContent from '$lib/components/TableOfContent.svelte';
	import SizeMode       from '$lib/components/SizeMode.svelte';

	import { browser }    from '$app/environment';
	import { onMount }    from 'svelte';
	import { pages }      from './pages';
	import { setPages }   from '$lib/presentation';
	import { scaleMode }  from '$lib/stores/scaleMode';

	// This presentation's own favicon, colocated in the folder.
	import favicon from './favicon.png';

	// Publish this presentation's slide list to its slides (nav + ToC read it).
	setPages(pages);

	let container: HTMLElement;
	let content:   HTMLElement;

	let   isScaled    = $scaleMode;
	let   initialized = false;
	const aspectRatio = 1280 / 720;

	function adjustSize() {
		if (!container)
			return;

		if (!isScaled) {
			container.style.width   = '1280px';
			container.style.height  =  '720px';
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
		let scale = (container.offsetWidth - 30) / 1280.0;
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

<!-- Per-presentation theming: this presentation's own favicon + a custom web font. -->
<svelte:head>
	<link rel="icon" href={favicon} />
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
		width: 1280px;
		height: 720px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		background: #0c0a07;          /* demo theme: warm near-black */
		border: 1px solid #5a4a36;    /* demo theme: warm border */
		position: relative;
	}
	.container.scale-mode {
		width: 100%;
		height: 100%;
		max-width: 100vw;
		max-height: 100vh;
	}
	.content {
		width: calc(1280px - 20px);
		height: calc(720px - 20px);
		min-width: calc(1280px - 20px);
		min-height: calc(720px - 20px);
		overflow: visible;
		padding: 10px;
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
		transform: translateY(-80px);
	}

</style>
