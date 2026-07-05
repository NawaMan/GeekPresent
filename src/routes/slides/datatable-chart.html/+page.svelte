<!--
  Example: DataTable + Charts driven by ONE dataset and ONE shared TableState.
  File: src/routes/slides/datatable-chart.html/+page.svelte

  The Phase 3 payoff: the table and the charts are one system over shared data.
  A single `visibleRows` runs the SAME pure pipeline the DataTable runs
  internally — filterRows → sortRows from $lib/datatable — and the charts sit
  downstream of it via `aggregate` (table-shaped rows → chart-shaped rows). So:

    • Type in the table's search / set a column filter → the charts reshape to
      the filtered subset (no chart-specific filter code — the shared pipeline).
    • Tick rows in the table (bind:selected, keyed by id) → their region's bar
      and pie slice light up (highlighted + rowKeyAccessor='group').

  No coupling: the charts never import DataTable types — the only contract is
  "plain arrays + accessors + pure pipeline". The table is also the accessible
  representation of the charted data (said so in each chart's description).

  Themed DARK, table and charts coherently: one accent (--dt-accent /
  --chart-highlight), the pie's slice separators use the panel --chart-bg.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import {
		DataTable,
		filterRows,
		inferColumnType,
		sortRows,
		type ColumnDef,
		type TableState
	} from '$lib/datatable';
	import { BarChart, PieChart, aggregate, sumOf } from '$lib/chart';
	import { servers, type ServerRow } from '../datatable-component.html/data';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/datatable-chart.html/+page.svelte';

	const columns: ColumnDef<ServerRow>[] = [
		{ key: 'id', label: 'ID', width: '4.5em' },
		{ key: 'name', label: 'Name', filterable: true },
		{ key: 'region', label: 'Region', filterable: true },
		{ key: 'status', label: 'Status' },
		{
			key: 'requests',
			label: 'Requests',
			type: 'number',
			align: 'right',
			format: (v) =>
				v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
		},
		{ key: 'deployed', label: 'Last deploy', type: 'date' }
	];

	let tableState = $state<TableState>({
		sort: null,
		search: '',
		columnFilters: {},
		page: 1,
		pageSize: 8
	});
	let selected = $state<ServerRow[]>([]);

	// The SAME pure pipeline the table runs internally, reused outside it —
	// exactly how the CSV export and the fake server already work. The charts
	// derive from this, so one filter/search feeds both the table and the charts.
	const visibleRows = $derived.by(() => {
		const s = tableState;
		const column = s.sort ? columns.find((c) => c.key === s.sort!.key) : undefined;
		const type = !column
			? 'string'
			: column.type && column.type !== 'auto'
				? column.type
				: inferColumnType(servers, column.key, column.sortValue);
		const filtered = filterRows(servers, s.search, columns, s.columnFilters);
		return sortRows(filtered, s.sort, type, column?.sortValue);
	});

	// table-shaped rows → chart-shaped {group, value, count} rows. Blank requests
	// are skipped by sumOf (not zeroed), so a missing value never inflates a bar.
	const byRegion = $derived(
		aggregate(visibleRows, 'region', { value: sumOf('requests'), label: 'Requests' })
	);
	const requestSeries = [{ key: 'value', label: 'Requests', value: 'value' }];

	// Selecting rows highlights their marks: map selected servers → their regions,
	// matched against each chart mark's `group` key (rowKeyAccessor='group').
	const selectedRegions = $derived([...new Set(selected.map((r) => r.region))]);
</script>

{#snippet statusBadge(row: ServerRow, value: ServerRow['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

<ContentPage
	title="DataTable + Charts"
	subtitle="One dataset, one shared state — filter the table, watch the charts follow"
>
	<div class="demo">
		<div class="charts">
			<BarChart
				data={byRegion}
				x={{ value: 'group' }}
				series={requestSeries}
				rowKeyAccessor="group"
				highlighted={selectedRegions}
				height={260}
				title="Requests by region (follows the table's filters)"
				description="Aggregated live from the table below, which is the accessible representation of this data."
			/>
			<PieChart
				data={byRegion}
				x={{ value: 'group' }}
				series={{ key: 'value', label: 'Requests', value: 'value' }}
				innerRadius={0.58}
				legend
				rowKeyAccessor="group"
				highlighted={selectedRegions}
				width={480}
				height={300}
				title="Request share by region"
				description="Same aggregation as the bar chart; the table below is the accessible representation."
			/>
		</div>

		<div class="table">
			<div class="table-head">
				<span class="selected-count" aria-live="polite">{selected.length} selected</span>
				{#if selectedRegions.length}
					<span class="selected-regions">→ {selectedRegions.join(', ')}</span>
				{/if}
			</div>
			<DataTable
				rows={servers}
				{columns}
				bind:state={tableState}
				selectable
				rowKey="id"
				bind:selected
				snippets={{ status: statusBadge }}
				height="360px"
				striped
			/>
		</div>
	</div>

	<p class="hint">
		Search or filter <b>Name</b>/<b>Region</b> — the bar and pie reshape to the filtered subset
		within one debounce cycle, no chart-specific filter code. Tick rows to light up their region's
		mark; clear the selection to un-dim. All of it flows from one <code>visibleRows</code> derived
		with the table's own pure <code>filterRows</code>/<code>sortRows</code>, then
		<code>aggregate</code>d for the charts.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* dark theme, shared by table AND charts (one accent) */
		--accent: #f0a840;
		--panel: #101821;

		--dt-font-size: 0.7em;
		--dt-bg: var(--panel);
		--dt-color: #d7e2ec;
		--dt-border: #35485c;
		--dt-header-bg: rgba(120, 170, 220, 0.12);
		--dt-stripe-bg: rgba(120, 170, 220, 0.05);
		--dt-row-hover: rgba(120, 170, 220, 0.14);
		--dt-selected-bg: rgba(240, 168, 64, 0.26);
		--dt-accent: var(--accent);

		--chart-font-size: 12px;
		--chart-fg: #d7e2ec;
		--chart-bg: var(--panel);
		--chart-grid: rgba(120, 170, 220, 0.14);
		--chart-axis: rgba(120, 170, 220, 0.5);
		--chart-highlight: var(--accent);
		--chart-slice-label: #0b1017;

		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.2em;
		align-items: start;
		max-width: 1600px;
		margin: 0 auto;
		text-align: initial;
		line-height: 1.35;
	}
	.charts {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		min-width: 0;
	}
	.table {
		min-width: 0;
	}
	.table-head {
		display: flex;
		align-items: baseline;
		gap: 0.6em;
		margin-bottom: 0.25em;
		font-size: 0.72em;
	}
	.selected-count {
		font-weight: 700;
		color: var(--accent);
	}
	.selected-regions {
		opacity: 0.8;
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
	.badge-offline {
		background: rgba(235, 100, 100, 0.18);
		color: #f49a9a;
	}
	.hint {
		margin: 0.6em auto 0;
		max-width: 1500px;
		text-align: center;
		opacity: 0.85;
		font-size: 0.72em;
	}
	.hint code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #f0d09e;
	}
</style>
