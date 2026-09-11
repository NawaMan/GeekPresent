<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

	const basic = `<RemoteData url={feedUrl} rowsPath="data" map={toRow}>
  {#snippet children(rows, meta)}
    <BarChart data={aggregate(rows, 'region', { value: sumOf('requests') })}
              x={{ value: 'group' }} series={[{ key: 'value', value: 'value' }]}
              title="Requests by region" />
    <DataTable {rows} {columns} />
  {/snippet}
  {#snippet pending()}<p>Loading…</p>{/snippet}
  {#snippet failed(message, reload)}
    <p>{message} <button onclick={reload}>Retry</button></p>
  {/snippet}
</RemoteData>`;

	const server = `// DataTable server mode over HTTP: the state IS the query string.
let state = $state({ sort: null, search: '', columnFilters: {}, page: 1, pageSize: 10 });
let rows = $state([]), total = $state(0), loading = $state(true);

async function load(next) {
  loading = true;
  ({ rows, total } = await fetchRows('/api/fleet', { params: toQuery(next) }));
  loading = false;
}

<DataTable {rows} {columns} bind:state mode="server"
           totalCount={total} {loading} onstatechange={load} />`;
</script>

<ContentPage title="RemoteData" subtitle="Tables and charts from a REST call">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<b>RemoteData</b> ($lib/data) fetches JSON at view time and hands the rows to a snippet.
			Everything downstream is unchanged — <code>DataTable</code> and every chart still take a plain array,
			so the only new question is where the array came from.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="svelte" code={basic} />

		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li>
				<code>url</code> — the endpoint. Import a colocated file as <code>./feed.json?url</code> to stay
				base-path safe.
			</li>
			<li>
				<code>rowsPath / totalPath</code> — dot paths into the payload; omit to auto-detect
				<code>data</code>/<code>items</code>/<code>results</code>.
			</li>
			<li>
				<code>map</code> — reshape each record; also what pins the generic so <code>rows</code> is typed.
			</li>
			<li>
				<code>params</code> — query parameters; changing them re-fetches (aborting the last request).
			</li>
			<li><code>poll</code> — re-fetch every N ms for a live slide.</li>
			<li>
				Snippets <code>children(rows, meta)</code> · <code>pending</code> ·
				<code>failed(message, reload)</code>
				· <code>empty</code>, plus <code>bind:rows/total/loading/error</code>.
			</li>
		</ul>

		<p style="margin-top: 0.7em; opacity: 0.85;">
			<b>Server-side paging</b> — <code>toQuery()</code> turns a <code>TableState</code> into the
			query string, which is the piece DataTable's <code>mode="server"</code> was missing.
		</p>
		<QuickCode style="margin-top: 0.4em;" lang="ts" code={server} />

		<Callout kind="warn" title="There is no server" style="margin-top: 0.8em;">
			This deck is static, so the request leaves the audience's browser. The endpoint must send
			<code>Access-Control-Allow-Origin</code>, and any key in <code>headers</code> ships in the
			bundle for the room to read. A surprising payload degrades to an empty table rather than
			throwing; a failed <i>request</i> shows the <code>failed</code> snippet — and once rows are on screen,
			a failed refresh leaves them there.
		</Callout>
	</div>
</ContentPage>
