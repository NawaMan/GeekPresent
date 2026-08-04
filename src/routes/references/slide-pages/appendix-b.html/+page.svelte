<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
</script>

<AppendixPage title="Appendix — part 2" subtitle="End of the chapter">
	<div style="line-height: 1.5;">
		<p>
			This is the last page of the appendix run. <b>NEXT</b> (or → / Space after any
			in-slide steps) leaves the chapter and returns to the caller —
			the same place the link started from.
		</p>
		<p style="margin-top: 0.7em;">
			You never hard-code that return path on these slides: <b>AppendixLink</b>
			stamped it when you jumped in, and every in-appendix hop re-stamps it.
		</p>
	</div>
</AppendixPage>
