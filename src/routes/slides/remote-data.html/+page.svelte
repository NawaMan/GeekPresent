<!--
  Example: data fetched over HTTP at view time, rendered as a table AND charts.
  File: src/routes/slides/remote-data.html/+page.svelte

  The other DataTable slides import their rows from a module. This one has no
  rows at all until the browser asks for them: <RemoteData> issues a real GET,
  and the table and the two charts sit downstream of whatever comes back.
  Nothing about them changes — they still take a plain array, which is the
  entire contract ($lib/chart/index.ts says so), so "where did the array come
  from" is a question only this one wrapper has to answer.

  `map` reshapes each record on the way in (deriving `status` from the raw
  error_rate), which is also what pins the generic: the snippet's `rows` come
  out typed FleetRow, not unknown[].

  The endpoint is a colocated fleet.json imported as `?url`, so Vite hashes it,
  bundles it, and makes it base-path aware — a real network request that still
  works offline and under a subdirectory deploy. Point `url` at a public REST
  API instead and nothing else on the slide moves; the two things that DO
  change are what the Hint says (CORS, and nowhere to hide a key).

  The readout under the table is the other half of the story: buildUrl +
  toQuery turn the table's live TableState into the query string a server-mode
  backend would answer. Here it is shown rather than sent, because a static
  JSON file cannot page — but it is the literal URL, not a mock-up.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import { RemoteData, buildUrl, toQuery } from '$lib/data';
	import { DataTable, type ColumnDef, type TableState } from '$lib/datatable';
	import { BarChart, PieChart, aggregate, sumOf } from '$lib/chart';
	import feedUrl from './fleet.json?url';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/remote-data.html/+page.svelte';

	/** One record exactly as the endpoint sends it. */
	interface FleetRaw {
		id: number;
		service: string;
		region: string;
		team: string;
		requests: number;
		p95_ms: number;
		error_rate: number;
		cost_usd: number;
		updated: string;
	}

	/** …and as the slide wants it: a derived health band the raw feed doesn't carry. */
	interface FleetRow extends FleetRaw {
		status: 'healthy' | 'degraded' | 'failing';
	}

	const toRow = (raw: FleetRaw): FleetRow => ({
		...raw,
		status: raw.error_rate < 1 ? 'healthy' : raw.error_rate < 3 ? 'degraded' : 'failing'
	});

	const columns: ColumnDef<FleetRow>[] = [
		{ key: 'service', label: 'Service', filterable: true },
		{ key: 'region', label: 'Region', filterable: true },
		{ key: 'status', label: 'Status', filterable: true },
		{
			key: 'requests',
			label: 'Requests',
			type: 'number',
			align: 'right',
			filterable: true,
			format: (v) => (typeof v === 'number' ? v.toLocaleString('en-US') : '—')
		},
		{
			key: 'p95_ms',
			label: 'p95',
			type: 'number',
			align: 'right',
			format: (v) => (typeof v === 'number' ? `${v} ms` : '—')
		},
		{
			key: 'cost_usd',
			label: 'Cost / mo',
			type: 'number',
			align: 'right',
			format: (v) =>
				typeof v === 'number' ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'
		},
		{ key: 'updated', label: 'Updated', type: 'date', filterable: true }
	];

	// The table's live state. Bound below, and read by the URL readout so the
	// room can watch a sort click become `&sort=requests&order=desc`.
	let tableState = $state<TableState>({
		sort: null,
		search: '',
		columnFilters: {},
		page: 1,
		pageSize: 9
	});

	/** What a server-mode backend would be asked for, right now. */
	const requestUrl = $derived(buildUrl('/api/fleet', toQuery(tableState)));

	/** Compact axis ticks: the y-axis label sits in a fixed 20px gutter beside
	 *  the tick text, so a full "25,000,000" runs straight through it. 22.5M
	 *  also just reads faster from the back of a room. */
	const millions = (v: number) => `${(v / 1_000_000).toFixed(1)}M`;

	const requestSeries = [{ key: 'value', label: 'Requests', value: 'value', format: millions }];
</script>

{#snippet statusBadge(row: FleetRow, value: FleetRow['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

<ContentPage
	title="Remote Data — Table + Charts from a REST Call"
	subtitle="No rows in the source: the browser fetches them, everything downstream is unchanged"
>
	<div class="demo">
		<RemoteData url={feedUrl} rowsPath="data" map={toRow}>
			{#snippet children(rows, meta)}
				{@const byRegion = aggregate(rows, 'region', {
					value: sumOf('requests'),
					label: 'Requests'
				})}
				<div class="layout">
					<div class="charts">
						<BarChart
							data={byRegion}
							x={{ value: 'group' }}
							series={requestSeries}
							width={760}
							height={290}
							title="Requests by region (fetched at view time)"
							description="Aggregated from the fetched fleet feed; the table beside it is the accessible representation of this data."
						/>
						<PieChart
							data={byRegion}
							x={{ value: 'group' }}
							series={{ key: 'value', label: 'Requests', value: 'value', format: millions }}
							innerRadius={0.58}
							legend
							width={620}
							height={330}
							title="Request share by region"
							description="Same aggregation as the bar chart; the table beside it is the accessible representation of this data."
						/>
					</div>

					<div class="table">
						<DataTable
							{rows}
							{columns}
							bind:state={tableState}
							snippets={{ status: statusBadge }}
							height="430px"
							striped
						/>

						<p class="readout">
							<span><b>{meta.total}</b> rows fetched</span>
							<span>a server would be asked: <code>GET {requestUrl}</code></span>
						</p>
					</div>
				</div>
			{/snippet}

			{#snippet pending()}
				<div class="placeholder">Fetching the fleet feed…</div>
			{/snippet}

			{#snippet failed(message, reload)}
				<div class="placeholder failed">
					<span>Could not load the feed — {message}</span>
					<button type="button" onclick={reload}>Try again</button>
				</div>
			{/snippet}
		</RemoteData>
	</div>

	<Hint
		text="The AUDIENCE's browser does the fetching — a real API must send CORS headers, and any key you attach is public."
	/>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* dark theme shared by the table, the charts and the wrapper's own
		   pending/failed states — one accent across all three. */
		--accent: #4aa3df;
		--panel: #101821;

		--dt-font-size: 0.6em;
		--dt-bg: var(--panel);
		--dt-color: #d7e2ec;
		--dt-border: #35485c;
		--dt-header-bg: rgba(120, 170, 220, 0.12);
		--dt-stripe-bg: rgba(120, 170, 220, 0.05);
		--dt-row-hover: rgba(120, 170, 220, 0.14);
		--dt-accent: var(--accent);

		--chart-font-size: 12px;
		--chart-fg: #d7e2ec;
		--chart-bg: var(--panel);
		--chart-grid: rgba(120, 170, 220, 0.14);
		--chart-axis: rgba(120, 170, 220, 0.5);
		--chart-slice-label: #0b1017;

		--remote-accent: var(--accent);
		--remote-muted: #9fb2c4;

		max-width: 1600px;
		margin: 0 auto;
		text-align: initial;
		line-height: 1.35;
	}

	/* Charts left, table right — the same two-column shape datatable-chart.html
	   uses, and the reason this fits: stacked vertically the table's pager ran
	   off the bottom of the 1080 canvas and under the Hint. */
	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.2em;
		align-items: start;
	}

	.charts,
	.table {
		min-width: 0;
	}

	.charts {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4em;
	}

	/* The wrapper's own states hold the height the loaded slide has, so the
	   deck doesn't jump when the response lands. */
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8em;
		min-height: 660px;
		font-size: 0.85em;
		opacity: 0.8;
	}

	.placeholder.failed {
		color: #f49a9a;
		opacity: 1;
	}

	.placeholder button {
		border: 1px solid currentColor;
		border-radius: 0.3em;
		background: transparent;
		color: inherit;
		cursor: pointer;
		padding: 0.2em 0.8em;
		font: inherit;
	}

	.readout {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4em 1.2em;
		margin: 0.4em 0 0;
		font-size: 0.6em;
		opacity: 0.85;
	}

	.readout code {
		font-family: 'Fira Code', ui-monospace, monospace;
		color: #f0d09e;
	}

	/* dark-surface badges: translucent fills, bright text */
	.badge {
		display: inline-block;
		padding: 0.1em 0.6em;
		border-radius: 999px;
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1.5;
	}
	.badge-healthy {
		background: rgba(80, 200, 110, 0.18);
		color: #7ce29a;
	}
	.badge-degraded {
		background: rgba(240, 170, 60, 0.18);
		color: #f5c069;
	}
	.badge-failing {
		background: rgba(235, 100, 100, 0.18);
		color: #f49a9a;
	}
</style>
