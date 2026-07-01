<!--
  Example: Carousel component
  File: src/routes/slides/carousel-component.html/+page.svelte

  A one-at-a-time stepper. Nest <CarouselItem>s of any markup inside a
  <Carousel>; step through them with the arrows or dots. The right-hand carousel
  shows the imperative API: external buttons drive it via bind:this, and
  `advanceOnClick` turns the whole stage into a build-step "next" cue.
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import Carousel      from '$lib/components/Carousel.svelte';
	import CarouselItem  from '$lib/components/CarouselItem.svelte';
	import ViewSource    from '$lib/components/ViewSource.svelte';
	import source        from './+page.svelte?raw';

	const path = 'src/routes/slides/carousel-component.html/+page.svelte';

	const cards = [
		{ n: 1, tint: '#1b2d3a', text: 'Any markup per item' },
		{ n: 2, tint: '#2a2038', text: 'Images, code, cards…' },
		{ n: 3, tint: '#1f3326', text: 'Arrows + dots built in' },
		{ n: 4, tint: '#38271c', text: 'bind:this for next()/prev()' },
	];

	let car;   // imperative handle on the second carousel
</script>

<ContentPage title="Carousel" subtitle="A one-at-a-time stepper — nest <CarouselItem>s, step with arrows, dots, or code">
	<div class="demos">
		<div class="demo">
			<h3>Fade · no wrap (loop=false)</h3>
			<Carousel width="820px" height="380px" keys="focus" loop={false}>
				{#each cards as c (c.n)}
					<CarouselItem>
						<div class="card" style="--tint: {c.tint};">
							<span class="badge">{c.n}</span>
							<span class="cap">{c.text}</span>
						</div>
					</CarouselItem>
				{/each}
			</Carousel>
		</div>

		<div class="demo">
			<h3>Slide · wheel · imperative API</h3>
			<Carousel bind:this={car} width="820px" height="380px" transition="slide" advanceOnClick wheel keys="focus">
				{#each cards as c (c.n)}
					<CarouselItem>
						<div class="card" style="--tint: {c.tint};">
							<span class="badge">{c.n}</span>
							<span class="cap">click or scroll to advance</span>
						</div>
					</CarouselItem>
				{/each}
			</Carousel>
			<p class="controls">
				<button class="btn" on:click={() => car.prev()}>prev()</button>
				<button class="btn" on:click={() => car.next()}>next()</button>
				<button class="btn" on:click={() => car.goTo(0)}>goTo(0)</button>
			</p>
		</div>
	</div>

	<p class="hint">
		Step with <kbd>,</kbd>/<kbd>&lt;</kbd> and <kbd>.</kbd>/<kbd>&gt;</kbd> — keys the deck's
		arrow-key nav leaves alone. Both carousels here use <code>keys="focus"</code> (two on one
		slide), so click one first; a lone carousel keeps the <code>global</code> default and steps
		deck-wide with no click.
	</p>
	<p class="props">
		Props: <code>width</code>, <code>height</code>, <code>start</code>, <code>loop</code>,
		<code>transition</code> (<code>fade</code>/<code>slide</code>/<code>none</code>),
		<code>duration</code>, <code>arrows</code>, <code>dots</code>, <code>advanceOnClick</code>,
		<code>wheel</code>, <code>keys</code> (<code>global</code>/<code>focus</code>/<code>off</code>),
		<code>label</code>.
		Methods via <code>bind:this</code>: <code>next()</code>, <code>prev()</code>,
		<code>goTo(i)</code>, <code>reset()</code>.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demos {
		display: flex;
		gap: 60px;
		justify-content: center;
		align-items: flex-start;
		margin: 0.4em 0;
	}
	.demo h3 {
		margin: 0 0 0.4em;
		text-align: center;
		font-size: 0.95em;
		opacity: 0.85;
	}

	.card {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4em;
		background: var(--tint, #1b2530);
		color: #e8eaed;
	}
	.badge {
		font-size: 3.2em;
		font-weight: 800;
		color: #f0a33e;
		line-height: 1;
	}
	.cap {
		font-size: 1em;
		opacity: 0.9;
	}

	.controls {
		margin: 0.6em 0 0;
		display: flex;
		gap: 0.6em;
		justify-content: center;
	}
	.btn {
		font-size: 0.85em;
		padding: 0.35em 0.8em;
		border-radius: 7px;
		border: 1.5px solid #3a5a2f;
		background: #223018;
		color: #d7f0c4;
		cursor: pointer;
		font-family: ui-monospace, monospace;
	}
	.btn:hover {
		background: #2c3f1f;
	}
	.hint {
		margin: 0.7em 0 0;
		text-align: center;
		opacity: 0.85;
		font-size: 0.9em;
	}
	.hint kbd {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
		padding: 0.05em 0.4em;
		border-radius: 5px;
		border: 1.5px solid #3a5a2f;
		background: #223018;
		color: #d7f0c4;
	}
	.props {
		margin: 0.5em 0 0;
		text-align: center;
		opacity: 0.8;
		font-size: 0.9em;
	}
</style>
