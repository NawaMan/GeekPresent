<!--
  Transition #4 (final): the honest limits — browser support + what the API can't do.
  File: src/routes/transition/limitations.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import SourceView  from '$lib/components/SourceView.svelte';
	import source      from './+page.svelte?raw';

	// SAME-document View Transitions (what this deck uses: goto + startViewTransition).
	// Now Baseline — supported across all three major engines.
	const support = [
		{ engine: 'Chrome / Edge', since: '111+', state: 'full', note: 'desktop & Android' },
		{ engine: 'Safari (WebKit)', since: '18+', state: 'full', note: 'macOS & iOS' },
		{ engine: 'Firefox', since: '144+', state: 'full', note: 'since Oct 2025' },
	];
</script>

<ContentPage title="Limits & browser support" subtitle="What it costs, and where it works — be honest with your audience">
	<div class="cols">
		<div class="support">
			<h3>Browser support</h3>
			<table>
				<thead>
					<tr><th>Engine</th><th>Same-doc</th><th></th></tr>
				</thead>
				<tbody>
					{#each support as row}
						<tr>
							<td>{row.engine}</td>
							<td><span class="pill {row.state}">{row.since}</span></td>
							<td class="note">{row.note}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="fine">
				<b>Baseline</b> across all three engines &mdash; and still a
				<b>progressive enhancement</b>: any browser without it just navigates
				plainly, nothing breaks.
			</p>
		</div>

		<div class="caveats">
			<h3>What it can't do</h3>
			<ul>
				<li><b>CSS / time-based only</b> &mdash; no drag-to-advance or gesture-following transitions; the animation can't track a finger.</li>
				<li><b>Not both at once</b> &mdash; the outgoing and incoming slides are snapshots, not two live, interactive pages.</li>
				<li><b>This deck's scaled canvas</b> &mdash; slides live inside a <code>transform: scale()</code> box, so a full-page fade/slide is cleanest; naming the inner element for a morph needs care.</li>
			</ul>
			<p class="fine">
				This deck uses <b>same-document</b> transitions &mdash; <code>goto</code> +
				<code>startViewTransition</code> in one document &mdash; which all three
				engines now ship. The other flavour, <b>cross-document</b>
				(<code>@view-transition</code>, keeping the full page load), is still
				Chromium&nbsp;+&nbsp;Safari only. Press <b>→</b> to feel it.
			</p>
		</div>
	</div>
</ContentPage>

<SourceView {source} />

<style>
	.cols {
		display: flex;
		gap: 64px;
		text-align: left;
		align-items: flex-start;
	}
	.support { flex: 0 0 600px; }
	.caveats { flex: 1 1 auto; }

	h3 {
		margin: 0 0 0.5em;
		color: var(--page-title-fg, #6EE7A0);
		font-family: 'Playfair Display Bold', 'Cormorant Garamond', serif;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92em;
	}
	th, td {
		text-align: left;
		padding: 0.45em 0.6em;
		border-bottom: 1px solid rgba(191, 217, 194, 0.25);
	}
	th { opacity: 0.6; font-weight: normal; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.06em; }
	.note { opacity: 0.7; font-size: 0.85em; }

	.pill {
		display: inline-block;
		padding: 0.1em 0.6em;
		border-radius: 999px;
		font-family: 'Fira Code', monospace;
		font-size: 0.85em;
		font-weight: bold;
	}
	.pill.full    { background: #2FA85F; color: #06210F; }
	.pill.partial { background: rgba(110, 231, 160, 0.18); color: #6EE7A0; border: 1px solid #2FA85F; }

	ul { margin: 0; padding-left: 1.1em; }
	li { margin-bottom: 0.5em; line-height: 1.25em; }

	.fine {
		margin-top: 0.9em;
		font-size: 0.85em;
		opacity: 0.82;
	}
</style>
