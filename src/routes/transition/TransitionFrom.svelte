<!--
  TransitionFrom — the "(from)" half of a transition pair.

  Shows the effect's CSS and explains BOTH directions: → performs the effect to the
  "(to)" slide; ← (from that "(to)" slide) replays it in reverse. The real
  navigation is the demo. The effect's kind is set on this slide's pages.ts entry.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CssSnippet  from '$lib/components/CssSnippet.svelte';

	export let title: string;
	export let subtitle = '';
	export let code = '';
	/** Verb phrase for the prompt, e.g. "cross-fade to the next page". */
	export let action = 'run this transition';
	/** What pressing → does (forward motion). */
	export let forward = '';
	/** What pressing ← does, from the next slide (reverse motion). */
	export let back = '';
</script>

<ContentPage {title} {subtitle}>
	<div class="from">
		<div class="code">
			<CssSnippet {code} />
		</div>

		<div class="cta">
			<p class="press">Press <kbd>→</kbd> to <b>{action}</b>.</p>

			<ul class="dirs">
				<li><span class="key">→</span> <b>Forward:</b> {forward}</li>
				<li><span class="key">←</span> <b>Back</b> <span class="muted">(from the next slide)</span>: {back}</li>
			</ul>

			<p class="aside"><slot /></p>
		</div>
	</div>
</ContentPage>

<style>
	.from { display: flex; align-items: center; gap: 56px; text-align: left; }
	.code { flex: 0 0 auto; }
	.cta  { flex: 1 1 auto; }

	.press { font-size: 1.25em; margin: 0 0 0.9em; }

	.dirs { list-style: none; padding: 0; margin: 0 0 0.9em; }
	.dirs li { font-size: 1.0em; line-height: 1.35em; margin-bottom: 0.6em; }
	.muted { opacity: 0.65; }

	.aside { font-size: 0.85em; opacity: 0.7; margin: 0; }

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
	kbd {
		display: inline-block;
		padding: 0.05em 0.5em;
		margin: 0 0.1em;
		border-radius: 7px;
		font-family: 'Fira Code', monospace;
		font-weight: bold;
		color: #06210F;
		background: #6EE7A0;
		box-shadow: 0 2px 0 #2FA85F;
	}
</style>
