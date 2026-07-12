<!--
  Shared-Element Morph (to) — the SAME four named cards (morph-1..4), now large and
  arranged in a 2x2 grid. Matching names is what makes each one morph across.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import SourceView  from '$lib/components/SourceView.svelte';
	import source      from './+page.svelte?raw';
</script>

<ContentPage title="Shared-Element Morph (to)" subtitle="Same four cards — each glided to its new size and slot">
	<div class="stage" aria-hidden="true">
		<div class="card card-1 m1">1</div>
		<div class="card card-2 m2">2</div>
		<div class="card card-3 m3">3</div>
		<div class="card card-4 m4">4</div>
	</div>

	<ul class="dirs">
		<li><span class="key">←</span> <b>Replay, reversed:</b> all four cards (and the heading) glide back into the little row.</li>
		<li><span class="key">→</span> <b>Next:</b> on to the limits &amp; browser support.</li>
	</ul>
</ContentPage>

<SourceView {source} />

<style>
	.stage { position: relative; width: 100%; height: 420px; }

	/* TO arrangement: large rounded cards spread into a 2x2 grid, far from the
	   little row on the "(from)" slide — so each card travels and grows visibly. */
	.card {
		position: absolute;
		width: 300px; height: 190px;
		border-radius: 26px;
		display: flex; align-items: center; justify-content: center;
		font-family: 'Playfair Display Bold', serif;
		font-size: 88px; font-weight: bold; color: #06210F;
		box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
	}
	.m1 { top: 0px;   left: 720px;  background: #6EE7A0; }
	.m2 { top: 0px;   left: 1080px; background: #43D17A; }
	.m3 { top: 220px; left: 720px;  background: #2FA85F; color: #EAFFF3; }
	.m4 { top: 220px; left: 1080px; background: #9BF2C0; }

	.dirs { list-style: none; padding: 0; margin: 0.4em auto 0; max-width: 40em; text-align: left; }
	.dirs li { font-size: 1.0em; line-height: 1.3em; margin-bottom: 0.45em; }
	.key {
		display: inline-block; width: 1.4em; text-align: center; margin-right: 0.25em;
		border-radius: 6px; font-family: 'Fira Code', monospace; font-weight: bold;
		color: #06210F; background: #6EE7A0;
	}
</style>
