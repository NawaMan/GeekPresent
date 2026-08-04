<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import Kbd from '$lib/components/Kbd.svelte';
</script>

<AppendixPage title="Appendix — part 1" subtitle="Hidden from the main march">
	<div style="line-height: 1.5;">
		<p>
			You arrived via <b>AppendixLink</b>. This slide is <code>hidden: true</code>, so
			the deck’s →/Space path never walks here on its own, and the TOC does not list it.
		</p>
		<p style="margin-top: 0.7em;">
			Contiguous hidden slides form <b>one chapter</b>. NEXT goes to part 2;
			PREV at the front of the chapter returns to the caller.
		</p>
		<p style="margin-top: 0.7em;">
			To leave early from anywhere in the appendix:
			<Kbd keys="up" /> (arrow <b>up</b>), <b>RETURN</b>, or <Kbd keys="backspace" />.
			All jump back to the caller stamped in <code>?return=…</code>.
		</p>
		<p style="margin-top: 0.7em; opacity: 0.85;">
			Look at the address bar: the return path is visible and travels with you as you
			page deeper into the chapter.
		</p>
	</div>
</AppendixPage>
