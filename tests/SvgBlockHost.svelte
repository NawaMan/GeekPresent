<!--
  Test host for SvgBlock: one from markup (a), one drawn in its slot (b).
-->
<script lang="ts">
	import SvgBlock from '$lib/components/SvgBlock.svelte';

	export let fit: 'contain' | 'cover' | 'fill' = 'contain';
	const file = '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="10" height="10" fill="currentColor"/></svg>';
</script>

<SvgBlock name="file" svg={file} title="From a file" {fit} x={10} y={20} width={300} height={150} />
<SvgBlock name="inline" viewBox="0 0 100 100" x={400} y={20} width={200} height={200}>
	<circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" />
</SvgBlock>
