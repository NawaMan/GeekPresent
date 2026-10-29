<!--
  StepDots — "this slide is a build, and here is how far in".

  A canvas-level singleton, like Spotlight: SlideDeck mounts it once and no slide
  places it. It reads the `activeSteps` store, which every Space-driven build
  registers with (a <Steps> run of Fragments, a Terminal with keys="global", a
  Video stepping its chapters), so whichever kind of build the slide has, the same
  row of dots appears near the bottom of the canvas (or at any edge or corner —
  `position`, set from SlideDeck's `stepDotsAt` or a slide's `stepDots` entry):

    ● ● ◉ ○ ○      filled = taken, the larger one = just taken, ring = still to come

  At rest it is faint, so it never competes with the slide. On arrival and on every
  step it brightens for a moment and settles back. When the last step is taken all
  the dots fill and the row fades out entirely — the speaker's cue that the next
  Space pages the deck. Above STEP_DOTS_MAX steps it draws one segmented bar instead.

  Renders nothing without a build (or in SSR, where no build has registered), so a
  slide with no Steps is untouched. Tagged `no-print`, so CAPTURE, print and `?shot`
  leave it out like the rest of the chrome — but deliberately NOT `gp-chrome`: that
  marker would let `fadeChrome` ghost an already-faint row into nothing. SlideDeck
  also holds it back under `?clean`. Opt out with `<SlideDeck stepDots={false}>` for a deck or
  `stepDots: false` on a pages.ts entry for one slide.

  Anchored with `top`, not `bottom`: canvas-space chrome anchored to the far edge
  misprints (see the handout notes in AGENTS.md), so it stays left/top like the rest.

  Role tokens (themes/roles.css): --stepdots-fg, --stepdots-idle, --stepdots-size,
  --stepdots-gap, --stepdots-inset. Maths in utils/stepDotsCore.ts.
-->
<script lang="ts">
	import { activeSteps } from '$lib/stores/activeSteps';
	import {
		stepDotsView,
		stepDotsLabel,
		stepDotsPlacement,
		stepDotsAnchorStyle,
		type StepDotsPosition
	} from '$lib/utils/stepDotsCore';

	/** Canvas size, to anchor the row against the chosen edge. */
	export let canvasWidth = 1920;
	export let canvasHeight = 1080;
	/** Which edge (its midpoint) or corner the row sits at. On 'left' / 'right' the
	    row stands up and runs along that edge. Unknown values fall back to 'bottom'. */
	export let position: StepDotsPosition = 'bottom';
	/** Inline style for the root element, applied last so it wins. */
	export let style: string = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. */
	let klass: string = '';
	export { klass as class };

	$: view = stepDotsView($activeSteps?.index, $activeSteps?.total);
	$: placement = stepDotsPlacement(position);
</script>

{#if view.kind !== 'none'}
	<div
		class="step-dots no-print {klass}"
		class:vertical={placement.vertical}
		data-position={placement.position}
		id={id || undefined}
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax={view.total}
		aria-valuenow={view.index}
		aria-label={stepDotsLabel(view)}
		style="{stepDotsAnchorStyle(placement, canvasWidth, canvasHeight)} {style}"
	>
		<!-- Keyed on the step, so each one restarts the brighten-and-settle animation. -->
		{#key view.index}
			<div class="row" class:spent={view.spent}>
				{#if view.kind === 'dots'}
					{#each view.dots as dot}
						<span class="dot {dot}"></span>
					{/each}
				{:else}
					<span class="bar">
						<span
							class="fill"
							style="{placement.vertical ? 'height' : 'width'}: {(view.fraction * 100).toFixed(3)}%"
						></span>
					</span>
				{/if}
			</div>
		{/key}
	</div>
{/if}

<style>
	.step-dots {
		position: absolute;
		z-index: 30;
		pointer-events: none;
		color: var(--stepdots-fg, #c0f1ff);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--stepdots-gap, 14px);
		opacity: var(--stepdots-idle, 0.3);
		animation: stepdots-pulse 1.6s ease-out;
	}
	.row.spent {
		opacity: 0;
		animation: stepdots-spent 2.2s ease-in;
	}
	.vertical .row {
		flex-direction: column;
	}
	.dot {
		box-sizing: border-box;
		width: var(--stepdots-size, 12px);
		height: var(--stepdots-size, 12px);
		border-radius: 50%;
		border: 2px solid currentColor;
		transition:
			transform 240ms ease,
			background-color 240ms ease;
	}
	.dot.done,
	.dot.current {
		background: currentColor;
	}
	.dot.current {
		transform: scale(1.35);
	}
	.bar {
		display: block;
		width: 240px;
		height: calc(var(--stepdots-size, 12px) / 2);
		border-radius: 999px;
		background: color-mix(in srgb, currentColor 30%, transparent);
		overflow: hidden;
	}
	.vertical .bar {
		width: calc(var(--stepdots-size, 12px) / 2);
		height: 240px;
	}
	.fill {
		display: block;
		height: 100%;
		background: currentColor;
		transition: width 240ms ease, height 240ms ease;
	}
	.vertical .fill {
		width: 100%;
	}

	@keyframes stepdots-pulse {
		0%,
		50% {
			opacity: 1;
		}
		100% {
			opacity: var(--stepdots-idle, 0.3);
		}
	}
	@keyframes stepdots-spent {
		0%,
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* No flashing for a viewer who asked for less motion: the row sits at its rest
	   opacity, and a finished build simply stays there, all filled. */
	@media (prefers-reduced-motion: reduce) {
		.row,
		.row.spent {
			animation: none;
			opacity: var(--stepdots-idle, 0.3);
		}
		.dot,
		.fill {
			transition: none;
		}
	}
</style>
