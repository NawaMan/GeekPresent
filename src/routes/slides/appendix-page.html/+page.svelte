<!--
  Example: AppendixPage / AppendixLink
  File: src/routes/slides/appendix-page.html/+page.svelte

  This slide is the CALLER. It demonstrates the feature by using it: the link in
  the prose really does jump into appendix-detail.html and really does come back
  here — which is the point, since the appendix hard-codes no destination.

  It also binds ↓ to make that jump, which is a SLIDE-LEVEL binding on purpose and
  not a framework one: only the caller knows which appendix it calls, so only the
  caller can bind a key to it. (↑ needs no such binding — leaving is the appendix's
  own business, and AppendixPage binds it.) Together they make the vertical axis
  mean one thing at the keyboard as well as on screen: ↓ steps out of the talk, ↑
  steps back into it, while ←/→ go on paging the deck as they always do.

  Two columns because the slide has both prose and code: stacked, they overflow
  the 1080px canvas (the canvas does not scroll — content simply runs off it).
-->
<script>
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import Columns      from '$lib/components/Columns.svelte';
	import Column       from '$lib/components/Column.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import AppendixLink from '$lib/components/AppendixLink.svelte';
	import Kbd          from '$lib/components/Kbd.svelte';
	import Callout      from '$lib/components/Callout.svelte';
	import Hint         from '$lib/components/Hint.svelte';
	import SourceView   from '$lib/components/SourceView.svelte';
	import source       from './+page.svelte?raw';

	import { browser }            from '$app/environment';
	import { page }               from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { navigate }           from '$lib/utils/deckNav';
	import { appendixHref, slidePathOf, KIND_IN } from '$lib/utils/appendixCore';

	const path = 'src/routes/slides/appendix-page.html/+page.svelte';

	/** The appendix this slide calls — the one the ↓ key and the link both go to. */
	const APPENDIX = 'appendix-detail.html';

	// The same href the AppendixLink builds, by the same helper: our own slide name is
	// the return address, so ↓ arrives with the way home already in the URL.
	$: href = appendixHref(APPENDIX, slidePathOf($page.url.pathname));

	// ↓ jumps in, with the same view transition the link uses — the key and the click
	// are the same navigation, so they must not look like two different ones.
	/** @param {KeyboardEvent} event */
	function handleKeydown(event) {
		if (event.key !== 'ArrowDown') return;
		// Never steal the key from someone typing (a filter box, a Draw label).
		const el = /** @type {HTMLElement | null} */ (event.target);
		if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
		event.preventDefault();
		navigate(href, { viewTransitions: true, kind: KIND_IN, direction: 'forward' });
	}

	onMount(()   => { if (browser) window.addEventListener('keydown', handleKeydown); });
	onDestroy(() => { if (browser) window.removeEventListener('keydown', handleKeydown); });
</script>

<ContentPage title="AppendixPage" subtitle="A slide as a function call, not a destination">
	<Columns widths={[3, 4]} gap="1em">
		<Column>
			<p style="font-size: 0.7em">
				The deep-dive a talk only <i>sometimes</i> needs — a proof, a full API table, a
				backup demo. Mark it <code>hidden</code> and it leaves the deck's forward march:
				<code>→</code>/<code>Space</code> never wander into it and the Table of Contents
				doesn't list it. Call it with <b>AppendixLink</b>; it comes back with <b>RETURN</b>.
			</p>

			<p style="margin-top: 0.8em; font-size: 0.8em">
				Try it — the heap is compacted on the way out,
				<AppendixLink to="appendix-detail.html" transition>and here is how it actually marks</AppendixLink>
				<Kbd keys="down" />. The key and the link do the same thing: <b>down</b> is out of the
				talk. Once there, <Kbd keys="up" /> brings you back — as does <b>RETURN</b>, or simply
				paging <b>NEXT</b> off the end of the appendix's two slides, which lands you right
				back on <i>this</i> one, mid-deck.
			</p>

			<p style="margin-top: 0.8em; font-size: 0.8em">
				<code>hidden</code> is <i>optional</i>: it does not make an appendix, it only decides
				whether the march can <i>find</i> one. Open the <b>Table of Contents</b> — that
				appendix isn't listed, but
				<AppendixLink to="appendix-listed.html">this one is</AppendixLink>: ordinary back
				matter you can page into, as a book lets you. Called from here, it still returns
				here.
			</p>

			<Callout kind="tip" style="margin-top: 0.8em; font-size: 0.65em">
				Watch the motion: <code>transition</code> takes you <i>down</i> to the appendix and
				back <i>up</i> out of it, so the vertical axis means "we stepped out of the talk" —
				while paging <i>within</i> it stays sideways, because that is just reading. The
				return address rides in the URL (<code>?return=appendix-page.html</code>) and every
				link inside re-stamps it, so going deeper never loses the way home.
			</Callout>
		</Column>

		<Column style="font-size: 0.8em" >
			<QuickCode lang="js" code={`// pages.ts — hidden decides only whether the march can FIND it
{ path: "appendix-gc.html",     title: "Appendix — GC", hidden: true },  // a detour
{ path: "appendix-listed.html", title: "Appendix — Listed" },            // back matter`} />

			<QuickCode style="margin-top: 0.9em;" lang="svelte" code={`<!-- the caller: it stamps its OWN name as the return address -->
<AppendixLink to="appendix-gc.html">
  how the GC actually marks
</AppendixLink>

<!-- the appendix itself: it names no caller, and needs none -->
<AppendixPage title="How the GC actually marks">
  <p>The long version, for when someone asks.</p>
</AppendixPage>`} />
		</Column>
	</Columns>
</ContentPage>

<!-- Both sit OUTSIDE ContentPage, as every other slide has them: a Hint's flow parent
     must be SlideDeck's own `.content` (a centring flex box, and the canvas font-size
     lever). Nested inside ContentPage it inherits the larger content font — rendering
     half again too big — and takes its static position from the prose, so it lands
     left instead of centred. -->
<Hint text="An appendix is a prerendered, linkable slide like any other — it just isn't part of the march" />
<SourceView {source} {path} />
