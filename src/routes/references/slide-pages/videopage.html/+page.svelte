<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import Hint from '$lib/components/Hint.svelte';
</script>

<ContentPage title="VideoPage" subtitle="Full-canvas video — then jump in to try it">
	<div style="width: 100%; line-height: 1.45; font-size: 0.95em;">
		<p>
			<b>VideoPage</b> is a complete slide: the player fills the canvas
			(sibling of <b>Video</b>, which is an in-flow element among other content).
			Optional chapter bookmarks, themed chrome, and
			<code>keys="global"</code> so Space steps chapters then pages the deck.
		</p>

		<p style="margin-top: 0.6em; font-size: 1.05em;">
			Live canvas —
			<AppendixLink to="videopage-demo.html">open the VideoPage demo</AppendixLink>
			(appendix: RETURN / ↑ / Backspace or NEXT off the end to come back).
		</p>

		<Columns widths={[0.92, 1.08]} gap="1.4em" align="start" style="margin-top: 0.75em;">
			<Column>
				<QuickCode lang="svelte" code={`<VideoPage
  src={clip}
  keys="global"
  bookmarks={[
    { at: '0:00', label: 'Start' },
    { at: '0:05', label: 'Mid' }
  ]}
/>

<!-- player chrome off (bare stage) -->
<VideoPage src={clip} controls={false} />`} />
			</Column>
			<Column>
				<p style="margin: 0; opacity: 0.9;"><b>Props that matter</b></p>
				<ul style="margin: 0.35em 0 0 1.1em; line-height: 1.45;">
					<li><code>src</code> — imported media URL</li>
					<li><code>controls</code> — player bar (default true); <code>false</code> for bare stage</li>
					<li><code>bookmarks / keys</code> — chapters; Space semantics with <code>global</code></li>
					<li><code>autoplay / muted / loop</code> — playback (incl. kiosk-aware autoplay)</li>
				</ul>

				<Callout kind="info" title="Note" style="margin-top: 0.75em;">
					Import the file as an asset (<code>import clip from './demo.mp4'</code>) so paths
					survive a base-path deploy.
				</Callout>
			</Column>
		</Columns>
	</div>
</ContentPage>

<Hint text="controls={false} hides the player chrome — different from WebPage’s chrome bar." />
