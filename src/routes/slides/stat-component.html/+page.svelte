<!--
  Example: Stat / StatGroup components
  File: src/routes/slides/stat-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Stat        from '$lib/components/Stat.svelte';
	import StatGroup   from '$lib/components/StatGroup.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/stat-component.html/+page.svelte';
</script>

<ContentPage title="Stat" subtitle="Big-number / KPI tiles — figure, label, trend">
	<div style="max-width: 780px;">
		<p>
			<b>Stat</b> is one hero figure with a label and an optional trend chip;
			<b>StatGroup</b> lays a set in an evenly-spaced, divider-separated row.
		</p>
		<p style="margin-top: 0.6em;">
			The chip colours itself from the direction — <code>up</code> reads
			positive, <code>down</code> negative — and every colour is a
			<code>roles.css</code> token (<code>--stat-*</code>).
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. fill=false
     keeps QuickCode at its natural size instead of stretching to the box. -->
<Block name="usage" x={900} y={250} width={920} height={300} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<StatGroup card>
  <Stat value="99.9%" label="Uptime" trend="up" delta="+0.4%" />
  <Stat value="42ms" label="p95" trend="down" delta="−12%" />
  <Stat value="1.2M"  label="Requests / day" accent />
  <Stat value="3.1%"  label="Error rate"  trend="flat" delta="±0" />
</StatGroup>`} />
</Block>

<!-- The KPI row in a `card` panel so it lifts off the surface, in a full-width band
     below both the intro and the usage sample. Parked in a Block for LAYOUT mode. -->
<Block name="kpis" x={120} y={640} width={1680} height={250} grid={10}>
	<StatGroup card>
		<Stat value="99.9%" label="Uptime"      sub="last 90 days" trend="up"   delta="+0.4%" />
		<Stat value="42ms"  label="p95 latency" sub="edge → origin" trend="down" delta="−12%" />
		<Stat value="1.2M"  label="Requests / day" accent />
		<Stat value="3.1%"  label="Error rate"  trend="flat" delta="±0" />
	</StatGroup>
</Block>

<Hint text="Flip LAYOUT (top-right) to place & resize the KPI row" />

<ViewSource {source} {path} />
