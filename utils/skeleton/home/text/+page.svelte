<!--
  Landing page for a skeleton adopted with --kind text (a Text artifact, no slide deck).
  adopt-geekpresent.sh substitutes __NAME__ for the page's route name. The original is
  preserved at .samples-ref/home-+page.svelte.orig.

  Scaffolding that explains itself and is then deleted. No styling of its own: the (home)
  layout wraps it in <TextPage>, the same shell the page below uses.
-->
<script lang="ts">
	// '' at the domain root, '/<repo>' under a base path — so the link is right either way.
	import { base } from '$app/paths';
</script>

<h1>Your page is live</h1>

<p>
	This is scaffolding. Read it, then replace it with your own landing page — it is just
	<code>src/routes/(home)/+page.svelte</code>.
</p>

<h2>Start here</h2>

<ul>
	<li>
		<strong>Your page:</strong> <a href="{base}/__NAME__">/__NAME__</a> — edit
		<code>src/routes/__NAME__/+page.svelte</code>. The title and description live next to it in
		<code>+layout.svelte</code>, and they are your SEO surface.
	</li>
	<li>
		<strong>Add another Text:</strong> copy the whole <code>src/routes/__NAME__/</code> folder,
		then add its route to <code>TEXT_ROUTES</code> in <code>src/lib/seo/routes.ts</code> — a Text
		is not discovered automatically, so without that line it builds but never reaches the sitemap.
	</li>
	<li>
		<strong>Want slides too?</strong> A deck is a folder of slide routes plus a
		<code>pages.ts</code> listing them. <code>.samples-ref/slides/</code> is a complete worked
		example — copy it and trim.
	</li>
	<li>
		<strong>Every component, by example:</strong> <code>.samples-ref/</code> holds the sample decks
		and Texts this project was scaffolded from — a slide per component, each its own documentation.
		It is gitignored but still on disk, so you (and your coding agent) can read it.
	</li>
</ul>

<h2>Then</h2>

<ul>
	<li>Build the static site: <code>pnpm install &amp;&amp; ./build-static.sh ./dist</code></li>
	<li>
		The conventions are in <code>AGENTS.md</code>, and as agent skills under
		<code>.claude/skills/</code>.
	</li>
</ul>
