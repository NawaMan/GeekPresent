<!--
  Example: Full-deck search
  File: src/routes/slides/full-deck-search.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Note from '$lib/components/Note.svelte';
	import Kbd from '$lib/components/Kbd.svelte';
</script>

<ContentPage title="Full-deck search" subtitle="Find the slide, don't page for it">
	<p>
		Open the <b>Table of Contents</b> (top-left) and a <b>Search slides…</b> box now sits
		above the list. Type a word and the list narrows to the slides that mention it — title
		matches and body matches, each with a snippet of the line it found.
	</p>
	<p>
		Try it right now: open the ToC and search <b>backpressure</b>, or <b>snippet</b>, or
		this slide's own subtitle. This very page is one of the hits.
	</p>
	<p style="margin-top: 0.5em;">A few things worth knowing:</p>
	<ul>
		<li>
			The index is built from each slide's <b>source</b> at build time (a <code>?raw</code>
			glob), so it can never drift from what is on screen — and it works on a static host,
			with no server to ask.
		</li>
		<li>It even searches the <b>speaker notes</b> — handy for you, invisible to the room.</li>
		<li><Kbd>Esc</Kbd> clears the search first; press it again to close the menu.</li>
	</ul>

	<Note>
		This note is here on purpose: search the ToC for the word "watermelon" and this slide
		is the only hit, because that word appears nowhere on screen — only in this speaker note.
		That is the point — a note you can find but the audience cannot see.
	</Note>
</ContentPage>
