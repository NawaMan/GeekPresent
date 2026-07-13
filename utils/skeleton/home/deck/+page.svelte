<!--
  The landing page for a skeleton-adopted project, written by adopt-geekpresent.sh
  (which substitutes __NAME__ for the deck name). The original is preserved at
  .samples-ref/home-+page.svelte.orig.

  This is scaffolding that explains itself and then gets deleted. The terminal said
  all of this once, at adopt time, and then scrolled away — this is the copy you can
  still find a week later. No styling of its own: the (home) layout wraps it in
  <TextPage>, which is what the real landing page uses too.
-->
<script lang="ts">
	// '' at the domain root, '/<repo>' under a base path — so the link is right either way.
	import { base } from '$app/paths';
</script>

<h1>Your deck is live</h1>

<p>
	This page is scaffolding. Read it, then replace it with your own landing page —
	it is just <code>src/routes/(home)/+page.svelte</code>.
</p>

<h2>Start here</h2>

<ul>
	<li>
		<strong>Your deck:</strong> <a href="{base}/__NAME__/title.html">/__NAME__/title.html</a> —
		edit <code>src/routes/__NAME__/title.html/+page.svelte</code>.
	</li>
	<li>
		<strong>Add a slide:</strong> create <code>src/routes/__NAME__/&lt;name&gt;.html/</code> with a
		<code>+page.svelte</code> and a <code>+layout.js</code>, then add a line to
		<code>src/routes/__NAME__/pages.ts</code>. That array <em>is</em> the deck: it sets the order
		you present in, and it is what the nav arrows and the table of contents read.
	</li>
	<li>
		<strong>Every component, by example:</strong> <code>.samples-ref/</code> holds the sample decks
		this project was scaffolded from — a slide per component, each one its own documentation. It is
		gitignored but still on disk, so you (and your coding agent) can read it. Copy from it freely.
	</li>
</ul>

<h2>Then</h2>

<ul>
	<li>Build the static site: <code>pnpm install &amp;&amp; ./build-static.sh ./dist</code></li>
	<li>
		The conventions — authoring slides, adding components, LAYOUT mode, the test contract — are in
		<code>AGENTS.md</code>, and as agent skills under <code>.claude/skills/</code>.
	</li>
</ul>
