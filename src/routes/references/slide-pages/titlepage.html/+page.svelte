<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import example from './titlepage-example.png';
</script>

<ContentPage title="TitlePage" subtitle="Opening slide with three named slots">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<b>TitlePage</b> is the cover of a deck. It centres three named slots —
			title, subtitle, subsubtitle — so every talk opens with a consistent vertical rhythm.
		</p>

		<Columns widths={[5, 5]} gap="1.5em" align="start" style="margin-top: 0.85em;">
			<Column>
				<QuickCode lang="svelte" code={`<TitlePage>
  <svelte:fragment slot="title">Talk Title</svelte:fragment>
  <svelte:fragment slot="subtitle">One-line promise</svelte:fragment>
  <svelte:fragment slot="subsubtitle">You · Event · Year</svelte:fragment>
</TitlePage>`} />

				<p style="margin-top: 0.75em; opacity: 0.85;"><b>Props that matter</b></p>
				<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
					<li><code>nav</code> — pass false only if you must hide the deck pager (rare)</li>
				</ul>
				<p style="margin-top: 0.6em; opacity: 0.75; font-size: 0.95em;">
					The deck’s own cover (previous slide) is a live TitlePage; the image on the
					right is that look captured so you can see it while reading the API.
				</p>
			</Column>
			<Column>
				<figure class="shot">
					<img src={example} alt="Example TitlePage: centered title, subtitle, and subsubtitle on a dark canvas" />
					<figcaption>What a TitlePage looks like on the canvas</figcaption>
				</figure>
			</Column>
		</Columns>
	</div>
</ContentPage>

<style>
	.shot {
		margin: 0;
		padding: 0;
	}
	.shot img {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 4px;
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
	}
	.shot figcaption {
		margin-top: 0.45em;
		font-size: 0.85em;
		opacity: 0.7;
		text-align: center;
	}
</style>
