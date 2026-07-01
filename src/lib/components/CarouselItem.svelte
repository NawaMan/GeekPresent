<!--
  CarouselItem — one slot of a <Carousel>.

  Wrap arbitrary markup; the item registers itself with the parent Carousel over
  context (in document order) and shows only when it's the active index. See
  Carousel.svelte for usage.
-->
<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	type CarouselCtx = {
		register: () => number;
		current: Writable<number>;
		mode: Writable<'fade' | 'slide' | 'none'>;
	};

	const { register, current, mode } = getContext<CarouselCtx>('carousel');

	// Runs during init, so items get sequential indices matching DOM order.
	const index = register();
	$: active = $current === index;
</script>

<div
	class="carousel-item mode-{$mode}"
	class:active
	aria-hidden={!active}
	inert={!active || undefined}
>
	<slot />
</div>

<style>
	.carousel-item {
		width: 100%;
		height: 100%;
	}

	/* fade / none: items are stacked; opacity switches which one shows. */
	.carousel-item.mode-fade,
	.carousel-item.mode-none {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		pointer-events: none;
	}
	.carousel-item.mode-fade {
		transition: opacity var(--carousel-dur, 0.4s) ease;
	}
	.carousel-item.mode-fade.active,
	.carousel-item.mode-none.active {
		opacity: 1;
		pointer-events: auto;
	}

	/* slide: items sit in the flex track, one viewport wide each. */
	.carousel-item.mode-slide {
		flex: 0 0 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@media (prefers-reduced-motion: reduce) {
		.carousel-item.mode-fade {
			transition: none;
		}
	}
</style>
