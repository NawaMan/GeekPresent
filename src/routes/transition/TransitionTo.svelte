<!--
  TransitionTo — the "(to)" half of a transition pair: the slide you land on.

  Explains both directions from HERE: ← replays the effect in reverse (via
  transitionBack in pages.ts); → bridges to the next effect with a plain slide.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';

	export let title: string;
	export let subtitle = '';
	/** Name of the effect that just played, e.g. "Cross-fade". */
	export let effect = '';
	/** What pressing ← does from here (reverse motion). */
	export let back = '';
</script>

<ContentPage {title} {subtitle}>
	<div class="to">
		<div class="check">✓</div>
		<p class="done"><b>{effect}</b> — that's what just happened.</p>

		<ul class="dirs">
			<li><span class="key">←</span> <b>Replay, reversed:</b> {back}</li>
			<li><span class="key">→</span> <b>Next effect</b></li>
		</ul>

		<p class="lead"><slot /></p>
	</div>
</ContentPage>

<style>
	.to { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 0.3em; }

	.check {
		font-size: 4em;
		line-height: 1;
		color: #6EE7A0;
		text-shadow: 0 6px 24px rgba(47, 168, 95, 0.5);
	}
	.done { font-size: 1.5em; margin: 0.1em 0 0.6em; }

	.dirs { list-style: none; padding: 0; margin: 0; text-align: left; }
	.dirs li { font-size: 1.05em; line-height: 1.35em; margin-bottom: 0.5em; max-width: 30em; }

	.lead { font-size: 0.95em; opacity: 0.8; max-width: 26em; margin: 0.6em 0 0; line-height: 1.3em; }

	.key {
		display: inline-block;
		width: 1.5em;
		text-align: center;
		margin-right: 0.3em;
		border-radius: 6px;
		font-family: 'Fira Code', monospace;
		font-weight: bold;
		color: #06210F;
		background: #6EE7A0;
	}
</style>
