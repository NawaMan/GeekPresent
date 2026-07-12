<!--
  Example: an appendix that is NOT hidden — back matter, in the open.
  File: src/routes/slides/appendix-listed.html/+page.svelte

  The contrast with appendix-detail.html is the whole point of this slide. That one
  is `hidden: true` — a detour nobody meets by accident. This one has no `hidden` at
  all, so it sits in the deck's linear order and in the Table of Contents: you can
  page into it, or pick it from the TOC, exactly like a book's back matter. It is
  still an appendix — a caller can jump in and it will return them — but it is not a
  secret.

  So `hidden` is not what MAKES an appendix. It only decides whether the deck's
  forward march can find it.

  One consequence, deliberate: NEXT here pages on into the deck (this slide IS in the
  march), not back to the caller — that behaviour belongs to a hidden run, whose ends
  lead out because there is nowhere else for them to lead. The way back is RETURN.
-->
<script>
	import AppendixPage from '$lib/templates/AppendixPage.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import Kbd          from '$lib/components/Kbd.svelte';
	import Callout      from '$lib/components/Callout.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/appendix-listed.html/+page.svelte';
</script>

<AppendixPage transition title="Appendix — Listed, not hidden" subtitle="An appendix the audience is allowed to see coming">
	<div>
		<p>
			Open the <b>Table of Contents</b>: this slide is <i>in</i> it, and the two-slide
			appendix you were just in is not. Both are appendices. The difference is one word in
			<code>pages.ts</code>.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="js" code={`{ path: "appendix-gc.html",     title: "Appendix — GC", hidden: true },  // a detour
{ path: "appendix-listed.html", title: "Appendix — Listed" },            // back matter`} />

		<p style="margin-top: 0.6em;">
			<code>hidden</code> does not make an appendix — it only decides whether the deck's
			forward march can <i>find</i> one. Without it, this slide is ordinary back matter:
			<code>→</code>/<code>Space</code> page into it, the TOC lists it, and a straight
			run-through of the deck walks right through — which is exactly what a book does with
			its appendices.
		</p>

		<p style="margin-top: 0.6em;">
			It is still an appendix, though: you were <i>called</i> here, so <b>RETURN</b> and
			<Kbd keys="up" /> still take you back to the slide that asked. <b>NEXT</b> does not —
			this slide is in the march, so NEXT marches on. Only a <i>hidden</i> run has ends that
			lead out, because it has nowhere else for them to lead.
		</p>

		<Callout kind="info" style="margin-top: 0.7em;">
			Reach this slide by paging, rather than by being called, and it is simply a slide: no
			RETURN control appears, because there is nobody to return to.
		</Callout>
	</div>
</AppendixPage>

<SourceView {source} {path} />
