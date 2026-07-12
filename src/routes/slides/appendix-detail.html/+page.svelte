<!--
  Example: the appendix itself — the slide jumped INTO. Page 1 of 2.
  File: src/routes/slides/appendix-detail.html/+page.svelte

  Its pages.ts entry carries `hidden: true`, contiguously with appendix-detail-2 —
  which is what makes the two of them one appendix CHAPTER, and takes both out of
  the deck's linear order. Note what is NOT here: no return address, no knowledge of
  any caller. AppendixPage reads that from the URL the caller stamped, which is why
  the same appendix can be called from several slides and land back on the right one.
-->
<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import Kbd          from '$lib/components/Kbd.svelte';
	import Callout      from '$lib/components/Callout.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/appendix-detail.html/+page.svelte';
</script>

<AppendixPage transition title="Appendix — How the GC marks" subtitle="Page 1 of 2 — the long version, for when someone asks">
	<div>
		<p>
			You got here by <i>calling</i> a slide — you came <i>down</i> to it — and the deck kept
			your place. Look at the address bar: <code>?return=appendix-page.html</code>, the slide
			that asked the question. <Kbd keys="up" /> goes straight back up to it from anywhere in
			the appendix, as do <b>RETURN</b> and <Kbd keys="backspace" />.
		</p>

		<p style="margin-top: 0.6em;">
			An appendix runs for as many slides as it needs, like a real book's. <b>NEXT</b>
			pages on to the second half of this one — and the return address travels with you,
			so going deeper never loses the way home. <b>PREV</b> here, at the front of the
			appendix, walks straight back out to the caller.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="js" code={`// pages.ts — contiguous hidden slides are ONE appendix chapter
{ path: "appendix-gc.html",   title: "Appendix — GC",             hidden: true },
{ path: "appendix-gc-2.html", title: "Appendix — Write barriers", hidden: true },`} />

		<Callout kind="info" style="margin-top: 0.7em;">
			Reach this slide with no <code>?return=</code> — a bookmark, a hand-typed URL — and
			the control reads <b>DECK</b> instead, because there is nobody to return to. An
			appendix must never strand you.
		</Callout>
	</div>
</AppendixPage>

<!-- Outside the template, like every other slide's — see appendix-page.html. -->
<SourceView {source} {path} />
