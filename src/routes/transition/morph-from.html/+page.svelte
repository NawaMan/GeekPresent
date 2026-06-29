<!--
  Shared-Element Morph (from) — FOUR named cards. Each carries its own
  view-transition-name (morph-1..4, assigned in view-transitions.css), so on → they
  ALL morph at once to their new places on the "(to)" slide — plus the heading.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CssSnippet  from '$lib/components/CssSnippet.svelte';
	import SourceView  from '../SourceView.svelte';
	import EffectDemo  from '../EffectDemo.svelte';
	import source      from './+page.svelte?raw';

	const css = `/* one name per card — four shared elements */
.card-1 { view-transition-name: morph-1; }
.card-2 { view-transition-name: morph-2; }
.card-3 { view-transition-name: morph-3; }
.card-4 { view-transition-name: morph-4; }

@view-transition { navigation: auto; }`;
</script>

<ContentPage title="Shared-Element Morph (from)" subtitle="Four named cards — watch them ALL fly to new places at once">
	<div class="top">
		<div class="text">
			<p class="lead">
				Each card has its own <code>view-transition-name</code>, so the browser pairs
				it with the same card on the next slide and glides it across.
			</p>
			<ul class="dirs">
				<li><span class="key">→</span> <b>Forward:</b> the four cards (and the heading) glide from this little row into the big grid.</li>
				<li><span class="key">←</span> <b>Back</b> <span class="muted">(from the next slide)</span>: they glide back from the grid into the row.</li>
			</ul>
		</div>
		<div class="code"><CssSnippet code={css} width="560px" /></div>
	</div>

	<div class="stage" aria-hidden="true">
		<div class="card card-1 m1">1</div>
		<div class="card card-2 m2">2</div>
		<div class="card card-3 m3">3</div>
		<div class="card card-4 m4">4</div>
	</div>
</ContentPage>

<EffectDemo kind="morph" />

<SourceView {source} />

<style>
	.top { display: flex; align-items: center; gap: 40px; text-align: left; margin-bottom: 0.5em; }
	.text { flex: 1 1 auto; }
	.code { flex: 0 0 auto; }
	.lead { font-size: 1.0em; line-height: 1.3em; margin: 0 0 0.7em; }

	.dirs { list-style: none; padding: 0; margin: 0; }
	.dirs li { font-size: 0.92em; line-height: 1.3em; margin-bottom: 0.45em; }
	.muted { opacity: 0.65; }
	.key {
		display: inline-block; width: 1.4em; text-align: center; margin-right: 0.25em;
		border-radius: 6px; font-family: 'Fira Code', monospace; font-weight: bold;
		color: #06210F; background: #6EE7A0;
	}

	.stage { position: relative; width: 100%; height: 360px; }

	/* FROM arrangement: a tight row of small circles, top-left. */
	.card {
		position: absolute;
		width: 96px; height: 96px;
		border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		font-family: 'Playfair Display Bold', serif;
		font-size: 38px; font-weight: bold; color: #06210F;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}
	.m1 { top: 20px; left: 30px;  background: #6EE7A0; }
	.m2 { top: 20px; left: 170px; background: #43D17A; }
	.m3 { top: 20px; left: 310px; background: #2FA85F; color: #EAFFF3; }
	.m4 { top: 20px; left: 450px; background: #9BF2C0; }
</style>
