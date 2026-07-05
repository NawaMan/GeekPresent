<!-- SSR host for the prerender test: a BarChart (with a negative and a blank)
     and a LineChart (with a null → gap) rendered via svelte/server with no DOM,
     proving each chart emits its complete <svg> from props alone — the same
     guarantee a prerendered slide needs, mirroring DrawSsrHost. -->
<script lang="ts">
	import BarChart from '../src/lib/chart/BarChart.svelte';
	import LineChart from '../src/lib/chart/LineChart.svelte';

	const regions = [
		{ region: 'us-east', net: 320 },
		{ region: 'us-west', net: -140 },
		{ region: 'eu-west', net: null }, // blank → no bar
		{ region: 'sa-east', net: 480 }
	];
	const samples = [
		{ month: 1, latency: 120 },
		{ month: 4, latency: 128 },
		{ month: 5, latency: null }, // blank → gap
		{ month: 6, latency: 145 }
	];
</script>

<BarChart
	data={regions}
	x={{ value: 'region', type: 'band' }}
	series={{ key: 'net', label: 'Net change', value: 'net', color: '#f0a33e' }}
	title="Net change by region"
	description="bars with a zero baseline"
/>
<LineChart
	data={samples}
	x={{ value: 'month', type: 'linear', label: 'Month' }}
	series={{ key: 'latency', label: 'Latency', value: 'latency' }}
	points
	title="Latency over time"
	description="a gapped line"
/>
