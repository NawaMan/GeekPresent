<!--
  Step 3 — the fork, closed: KeyframeStudio folded into Sprite.
  File: src/routes/animation-check/studio-vs-sprite.html/+page.svelte

  This slide used to run a live <KeyframeStudio> beside the Sprite path to
  contrast the two. That tool is now RETIRED — SpriteStudio (a Sprite in a Draw)
  does the same job on the unified path, so the KeyframeStudio component was
  deleted. What remains here is the before/after: what the old tool did, and how
  the Sprite path does it now. The live version is the next slide.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Label from '$lib/components/Label.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/animation-check/studio-vs-sprite.html/+page.svelte';
</script>

<ContentPage title="Two tools, folded into one" subtitle="KeyframeStudio is retired — the Sprite path absorbed it.">
	<div class="cols">
		<section class="col studio">
			<h3>KeyframeStudio <span>· retired</span></h3>
			<ul>
				<li>Bundled its <b>own</b> AnimationBar.</li>
				<li><b>Web Animations API</b> — built in JS at runtime, not prerendered.</li>
				<li>Its own panel with numeric <code>l/t/w/h/r</code> fields.</li>
				<li><b>Copy</b> emitted raw <code>@keyframes</code> CSS.</li>
			</ul>
		</section>
		<section class="col sprite">
			<h3>Sprite in Draw <span>· the one path</span></h3>
			<ul>
				<li>Rides <b>one shared</b> AnimationBar with every Draw shape.</li>
				<li>Pure <b>CSS <code>@keyframes</code></b> — prerenders, runs with no JS.</li>
				<li>Edited by the <b>shared Draw toolbar</b>: drag <i>and</i> numeric
					<code>L/T/W/H/R</code>.</li>
				<li><b>Copy</b> emits a <code>&lt;Sprite&gt;</code> tag — a real component.</li>
			</ul>
		</section>
	</div>
	<p class="watch">
		The two carried <b>byte-identical stop data</b>
		(<code>&#123; pct, x, y, w, h, rot, ease &#125;</code>), so there was nothing to
		port but the numeric fields &mdash; which now live in the Draw toolbar. With
		that in place, <Label>KeyframeStudio</Label> was <b>deleted</b>:
		<Label>Sprite</Label> is the primitive, <Label>SpriteStudio</Label> the
		drop-in wrapper. See it live on the next slide.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.4em;
		margin-top: 0.2em;
	}
	.col {
		border-radius: 12px;
		padding: 0.6em 1em 0.7em;
		border: 2px solid;
	}
	.col h3 {
		margin: 0 0 0.15em;
		font-size: 1.02em;
	}
	.col h3 span {
		font-weight: normal;
		font-size: 0.78em;
		opacity: 0.7;
	}
	.col ul {
		margin: 0;
		padding-left: 1.1em;
	}
	.col li {
		margin: 0.28em 0;
		line-height: 1.2em;
	}
	.col.studio {
		border-color: #7a6f5a;
		background: rgba(122, 111, 90, 0.14);
	}
	.col.studio h3 {
		color: #c9b98a;
	}
	.col.sprite {
		border-color: #2e8b57;
		background: rgba(46, 139, 87, 0.12);
	}
	.col.sprite h3 {
		color: #7fe0a6;
	}
	.col code {
		font-size: 0.82em;
		color: #cfe3f2;
	}
	.watch {
		margin: 0.7em 0 0;
		font-size: 0.95em;
		line-height: 1.4em;
		color: #d6e6f2;
	}
</style>
