<!--
  Example: Timeline component
  File: src/routes/slides/timeline-component.html/+page.svelte
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import Timeline     from '$lib/components/Timeline.svelte';
	import TimelineItem from '$lib/components/TimelineItem.svelte';
	import Block        from '$lib/components/Block.svelte';
	import Hint         from '$lib/components/Hint.svelte';
	import ViewSource   from '$lib/components/ViewSource.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/timeline-component.html/+page.svelte';
</script>

<ContentPage title="Timeline" subtitle="Narrative event spine — milestones, roadmaps">
	<div style="max-width: 680px;">
		<p>
			<b>Timeline</b> threads events on a single line — each a marker dot, a
			<b>time</b> label, a title and a body. The container half of a
			<code>Timeline</code> / <code>TimelineItem</code> pair.
		</p>
		<p style="margin-top: 0.5em;">
			<code>side</code> puts the events <b>right</b>, <b>left</b>, or
			<b>alternate</b>; a per-event <code>icon</code>, <code>color</code> and
			<code>active</code> halo make one milestone stand out.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. -->
<Block name="usage" x={1080} y={250} width={760} height={220} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<Timeline side="alternate">
  <TimelineItem time="2019" title="Founded">…</TimelineItem>
  <TimelineItem time="Today" title="Here" active />
</Timeline>`} />
</Block>

<!-- Default: spine on the left, every event to its right. -->
<Block name="right" x={120} y={560} width={640} height={400} grid={10}>
	<Timeline>
		<TimelineItem time="2019" title="Founded">Two people, one garage.</TimelineItem>
		<TimelineItem time="2021" title="Series A" icon="★" color="#f0a33e">
			Ten million users; the servers held.
		</TimelineItem>
		<TimelineItem time="Today" title="You are here" active>
			Shipping daily.
		</TimelineItem>
	</Timeline>
</Block>

<!-- Alternate: spine centred, events zig-zag left / right. -->
<Block name="alt" x={860} y={500} width={960} height={440} grid={10}>
	<Timeline side="alternate">
		<TimelineItem time="v1.0" title="Launch">First public build.</TimelineItem>
		<TimelineItem time="v2.0" title="Plugins" icon="◆">An extension API.</TimelineItem>
		<TimelineItem time="v3.0" title="Cloud sync">Cross-device, offline-first.</TimelineItem>
		<TimelineItem time="Next" title="Roadmap" active>Real-time collaboration.</TimelineItem>
	</Timeline>
</Block>

<Hint text="Flip LAYOUT (top-right) to place & resize either timeline" />

<ViewSource {source} {path} />
