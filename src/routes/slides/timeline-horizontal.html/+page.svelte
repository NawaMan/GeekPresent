<!--
  Example: Timeline — horizontal orientation & scrolling a long one
  File: src/routes/slides/timeline-horizontal.html/+page.svelte
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import Timeline     from '$lib/components/Timeline.svelte';
	import TimelineItem from '$lib/components/TimelineItem.svelte';
	import ScrollDiv    from '$lib/components/ScrollDiv.svelte';
	import Hint         from '$lib/components/Hint.svelte';
	import ViewSource   from '$lib/components/ViewSource.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/timeline-horizontal.html/+page.svelte';

	// A short alternate band that fits the canvas outright.
	const releases = [
		{ time: 'v1.0', title: 'Launch',     body: 'Public build.' },
		{ time: 'v1.5', title: 'Plugins',    body: 'Extension API.', icon: '◆' },
		{ time: 'v2.0', title: 'Cloud sync', body: 'Offline-first.' },
		{ time: 'v2.5', title: 'Mobile',     body: 'iOS & Android.' },
		{ time: 'v3.0', title: 'Realtime',   body: 'Live cursors.', active: true },
	];

	// A long history — more events than fit, so it lives in a ScrollDiv.
	const history = [
		{ y: '2010', t: 'Idea' },      { y: '2011', t: 'Prototype' },
		{ y: '2012', t: 'Founded' },   { y: '2013', t: 'Seed' },
		{ y: '2014', t: 'Beta' },      { y: '2015', t: 'Series A', icon: '★' },
		{ y: '2016', t: '1M users' },  { y: '2017', t: 'Series B' },
		{ y: '2018', t: 'Global' },    { y: '2019', t: 'IPO' },
		{ y: '2020', t: 'Remote' },    { y: '2021', t: '100M users' },
		{ y: '2022', t: 'AI launch' }, { y: '2023', t: 'Today', active: true },
	];
	// Each event is a fixed width with a fixed gutter, so the whole spine is about
	// this wide — give ScrollDiv a hair more so the last event is reachable.
	const itemPx = 210, gapPx = 36;
	const spanW = history.length * itemPx + (history.length - 1) * gapPx + 40;
</script>

<ContentPage title="Timeline — horizontal" subtitle="orientation=&quot;horizontal&quot; · a long one pans in a ScrollDiv">
	<p style="max-width: 1240px;">
		A horizontal <b>Timeline</b> lays its events in a row on a fixed-height band;
		<code>side</code> puts them <b>below</b> (default), <b>above</b> or
		<b>alternate</b>. Each event is a fixed width, so an over-long history just
		<b>pans</b> inside a <code>ScrollDiv&nbsp;axis="x"</code>.
	</p>

	<!-- Short alternate band — fits outright. Its content zig-zags above/below the
	     spine, so it needs a band tall enough for both halves. -->
	<Timeline orientation="horizontal" side="alternate" band="250px" itemWidth="250px" gap="44px">
		{#each releases as r}
			<TimelineItem time={r.time} title={r.title} icon={r.icon ?? ''} active={r.active}>
				{r.body}
			</TimelineItem>
		{/each}
	</Timeline>

	<!-- Long history — more than fits, so it pans. time + title only keeps the band
	     short; every event below the spine. -->
	<p style="margin: 0.9em 0 0.4em; font-weight: bold; opacity: 0.85;">
		A 14-year history in a <code>ScrollDiv</code> ↓ &nbsp;— wheel over it, or drag the bar
	</p>
	<ScrollDiv
		axis="x"
		outerWidth="1720"
		outerHeight="150"
		innerWidth={String(spanW)}
		scrollbar
		style="border-radius: 8px; background: color-mix(in srgb, var(--ACCENT, #2980b9) 6%, transparent);"
	>
		<Timeline orientation="horizontal" side="below" band="120px" itemWidth="{itemPx}px" gap="{gapPx}px">
			{#each history as h}
				<TimelineItem time={h.y} title={h.t} icon={h.icon ?? ''} active={h.active} />
			{/each}
		</Timeline>
	</ScrollDiv>
</ContentPage>

<Hint text="The long band scrolls — wheel over it, or drag the scrollbar" />

<ViewSource {source} {path} />
