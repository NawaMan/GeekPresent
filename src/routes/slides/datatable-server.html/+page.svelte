<!--
  Example: DataTable component — server-side data (server mode)
  File: src/routes/slides/datatable-server.html/+page.svelte

  The same table as the previous slide, but mode="server": the component
  never touches the rows — it renders exactly what it's given and emits
  onstatechange(state) after every sort click, search, or page change.
  Here a fake server (setTimeout + the same pure tableCore functions)
  answers each emission with one page of rows plus totalCount for the
  readout and page math; a real backend would answer an HTTP query built
  from the same TableState. bind:state keeps the UI and the fetches on one
  shared state object. Styled with a colorful "candy" --dt-* palette — the
  finale of the deck's light (static) → dark (tools) → colorful (server)
  theming range; same component, only the custom-property values differ.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import {
		DataTable,
		filterRows,
		inferColumnType,
		paginateRows,
		sortRows,
		type ColumnDef,
		type TableState
	} from '$lib/datatable';
	import { servers, type ServerRow } from '../datatable-component.html/data';
	import source from './+page.svelte?raw';
	import { onMount } from 'svelte';

	const path = 'src/routes/slides/datatable-server.html/+page.svelte';

	const columns: ColumnDef<ServerRow>[] = [
		{ key: 'id', label: 'ID', width: '4.5em' },
		{ key: 'name', label: 'Name' },
		{ key: 'region', label: 'Region' },
		{ key: 'status', label: 'Status' }, // rendered by the statusBadge snippet
		{
			key: 'requests',
			label: 'Requests',
			type: 'number',
			align: 'right',
			format: (v) =>
				v == null ? '—' : typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
		},
		{
			key: 'cost',
			label: 'Cost / mo',
			type: 'number',
			align: 'right',
			format: (v) =>
				v == null
					? '—'
					: `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
		},
		{
			key: 'deployed',
			label: 'Last deploy',
			type: 'date',
			sortValue: (r) => (r.deployed === 'pending' ? '9999-12-31' : r.deployed)
		}
	];

	// One shared state object: the table writes into it on every interaction
	// (and onstatechange hands it to the fake server), and honors it back.
	let tableState = $state<TableState>({
		sort: null,
		search: '',
		columnFilters: {},
		page: 1,
		pageSize: 10
	});

	// Fake server: the same pure tableCore pipeline, behind a setTimeout — it
	// receives the emitted TableState and answers with one page + totalCount.
	// A real implementation would be an HTTP call carrying the same state.
	let serverRows = $state<ServerRow[]>([]);
	let serverTotal = $state(0);
	let serverLoading = $state(true); // true until the first "response" lands
	let pending: ReturnType<typeof setTimeout>;

	function fetchFromServer(state: TableState) {
		serverLoading = true;
		clearTimeout(pending);
		pending = setTimeout(() => {
			const column = state.sort ? columns.find((c) => c.key === state.sort?.key) : undefined;
			const type = !column
				? 'string'
				: column.type && column.type !== 'auto'
					? column.type
					: inferColumnType(servers, column.key, column.sortValue);
			const filtered = filterRows(servers, state.search, columns, state.columnFilters);
			const sorted = sortRows(filtered, state.sort, type, column?.sortValue);
			serverTotal = sorted.length;
			serverRows = paginateRows(sorted, state.page, state.pageSize);
			serverLoading = false;
		}, 350);
	}

	// first load (client only — the prerendered page shows the loading overlay)
	onMount(() => {
		fetchFromServer($state.snapshot(tableState) as TableState);
		return () => clearTimeout(pending);
	});
</script>

{#snippet statusBadge(row: ServerRow, value: ServerRow['status'])}
	<span class="badge badge-{value}">{value}</span>
{/snippet}

<ContentPage
	title="DataTable — Server-Side Data"
	subtitle="Server mode: the component renders what it's given and asks for more"
>
	<div class="demo">
		<DataTable
			rows={serverRows}
			{columns}
			bind:state={tableState}
			mode="server"
			totalCount={serverTotal}
			loading={serverLoading}
			onstatechange={fetchFromServer}
			snippets={{ status: statusBadge }}
			height="490px"
			striped
		/>
	</div>

	<p class="hint">
		Every sort click, search, or page change emits <code>onstatechange(state)</code>; a fake
		server (<code>setTimeout</code>, 350&thinsp;ms — watch the loading overlay) answers with one
		page of rows plus <code>totalCount</code>. The table applies <b>no processing of its own</b> —
		swap the fake for an HTTP call and nothing else changes.
	</p>
	<p class="props">
		Server-mode props: <code>mode="server"</code>, <code>totalCount</code> (readout + page math),
		<code>onstatechange</code> (refetch signal), <code>bind:state</code> (full
		<code>TableState</code>: <code>sort</code>, <code>search</code>, <code>page</code>,
		<code>pageSize</code>), <code>loading</code>. Client mode on the previous slides needs none of
		these — switching is a props-only change. The candy look is just different
		<code>--dt-*</code> values (light → dark → colorful across the three slides).
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		--dt-font-size: 0.72em;
		/* colorful "candy" theme — purple header, pink accent, sky stripes;
		   the finale of the deck's light → dark → colorful theming range.
		   Same component, only --dt-* values differ. */
		--dt-bg: #fff9f2;
		--dt-color: #3a2b4d;
		--dt-border: #c77dff;
		--dt-header-bg: rgba(155, 93, 229, 0.28);
		--dt-stripe-bg: rgba(0, 187, 249, 0.1);
		--dt-row-hover: rgba(0, 245, 212, 0.22);
		--dt-accent: #f15bb5;
		margin: 0.3em auto 0;
		max-width: 1600px;
		line-height: 1.35;
		text-align: initial;
	}
	/* candy-saturated badges to match the theme */
	.badge {
		display: inline-block;
		padding: 0.1em 0.6em;
		border-radius: 999px;
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1.5;
	}
	.badge-healthy {
		background: rgba(0, 245, 212, 0.35);
		color: #00705c;
	}
	.badge-degraded {
		background: rgba(254, 228, 64, 0.6);
		color: #6e5600;
	}
	.badge-offline {
		background: rgba(241, 91, 181, 0.28);
		color: #a81b69;
	}
	.hint {
		margin: 0.6em 0 0;
		text-align: center;
		opacity: 0.85;
		font-size: 0.8em;
	}
	.props {
		margin: 0.4em 0 0;
		text-align: center;
		opacity: 0.8;
		font-size: 0.72em;
	}
	.hint code,
	.props code {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		color: #f0d09e;
	}
</style>
