<!--
  Example: the appendix, page 2 of 2 — the END of the run.
  File: src/routes/slides/appendix-detail-2.html/+page.svelte

  This is where the design earns itself: there is no slide after this one in the
  appendix, so NEXT — and → and Space, the keys a speaker actually reaches for —
  page OUT, back to the caller. Walking forward off the end of an appendix is what
  returning from it means. No new gesture to learn.
-->
<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import Callout      from '$lib/components/Callout.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/appendix-detail-2.html/+page.svelte';
</script>

<AppendixPage transition title="Appendix — Write barriers" subtitle="Page 2 of 2 — the end of the run">
	<div>
		<p>
			Still inside the appendix: <b>PREV</b> goes back to its first page, and the address
			bar still carries <code>?return=appendix-page.html</code>, because every link within
			an appendix re-stamps it.
		</p>

		<p style="margin-top: 0.6em;">
			But this is the <i>last</i> slide of the run — so <b>NEXT</b> does not stop dead, and
			it does not march on into the rest of the deck either. It takes you back to the slide
			that called the appendix. <code>→</code> and <code>Space</code> do the same, because
			they are the same navigation: the ordinary forward march, applied at the end of an
			appendix, <i>is</i> the return.
		</p>

		<Callout kind="tip" style="margin-top: 0.7em;">
			Which is why <b>RETURN</b> is a shortcut rather than the mechanism — it is there for
			leaving from the <i>middle</i> of a long appendix, when the speaker has answered the
			question and doesn't want to page through the rest of it on stage.
		</Callout>
	</div>
</AppendixPage>

<SourceView {source} {path} />
