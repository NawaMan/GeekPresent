<!-- Harness for the RemoteData DOM tests: supplies all four snippets and binds
     every output, so a test can drive props through rerender() and read both
     what rendered AND what was written back to the parent. -->
<script lang="ts">
	import RemoteData from '../src/lib/data/RemoteData.svelte';

	type Row = { name: string };

	let {
		url = '/api/rows',
		params = undefined,
		rowsPath = undefined,
		totalPath = undefined,
		poll = 0
	}: {
		url?: string;
		params?: Record<string, string | number>;
		rowsPath?: string;
		totalPath?: string;
		poll?: number;
	} = $props();

	let rows = $state<Row[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let error = $state('');
</script>

<RemoteData
	{url}
	{params}
	{rowsPath}
	{totalPath}
	{poll}
	bind:rows
	bind:total
	bind:loading
	bind:error
>
	{#snippet children(items, meta)}
		<ul data-testid="rows">
			{#each items as item (item.name)}
				<li>{item.name}</li>
			{/each}
		</ul>
		<p data-testid="meta">{meta.total} total</p>
		<button data-testid="reload" type="button" onclick={meta.reload}>reload</button>
	{/snippet}

	{#snippet pending()}
		<p data-testid="pending">fetching</p>
	{/snippet}

	{#snippet failed(message, reload)}
		<p data-testid="failed">{message}</p>
		<button data-testid="retry" type="button" onclick={reload}>retry</button>
	{/snippet}

	{#snippet empty()}
		<p data-testid="empty">nothing came back</p>
	{/snippet}
</RemoteData>

<p data-testid="bound">
	{loading ? 'loading' : error ? `error:${error}` : `ok:${rows.length}/${total}`}
</p>
