<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Box" subtitle="Expandable overlay">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Box</b> is a modal-like overlay that expands over the slide for detail (image, long code, digression) and dismisses on close or key.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<script>
  let open = false;
</script>
<button on:click={() => (open = true)}>Detail</button>
<Box bind:expanded={open} width={900} height={500}>
  <!-- overlay body -->
</Box>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>expanded</code> — bindable open state</li>
			<li><code>width / height</code> — overlay size in canvas px</li>
	</ul>

	</div>
</ContentPage>
