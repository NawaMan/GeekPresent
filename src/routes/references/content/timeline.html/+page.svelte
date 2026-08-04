<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Timeline & TimelineItem" subtitle="Sequence of events">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Timeline</b> lays out <b>TimelineItem</b> entries vertically or horizontally. Pair with ScrollDiv when the history is long.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Timeline>
  <TimelineItem when="2024" title="Prototype">First static deck.</TimelineItem>
  <TimelineItem when="2025" title="References">This catalog.</TimelineItem>
</Timeline>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>orientation</code> — vertical (default) or horizontal</li>
			<li><code>when / title</code> — on each TimelineItem</li>
	</ul>

	</div>
</ContentPage>
