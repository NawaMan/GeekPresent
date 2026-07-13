<!--
  Landing page for a skeleton adopted with --kind none: the framework, and nothing authored.
  This is the only page in the site, so it carries the whole getting-started story — there is
  no deck to click into and no worked example in the tree, only in .samples-ref/.

  The original landing page is preserved at .samples-ref/home-+page.svelte.orig.
-->
<h1>GeekPresent is installed. Nothing is authored yet.</h1>

<p>
	You asked for an empty tree, so this page is the only one in it. Everything below is a
	recipe — and <code>.samples-ref/</code> (gitignored, still on disk) holds the sample decks
	and Texts this project was scaffolded from, so nothing here is guesswork: there is a worked
	example of every one of them.
</p>

<h2>To build a slide deck</h2>

<p>
	A deck is a route folder holding one folder per slide, plus a <code>pages.ts</code> that lists
	them. Create <code>src/routes/&lt;deck&gt;/</code> with:
</p>

<ul>
	<li><code>+layout.js</code> — <code>prerender = true</code>, <code>trailingSlash = "always"</code></li>
	<li><code>+layout.svelte</code> — renders <code>&lt;SlideDeck&gt;</code> and calls <code>setPages(pages)</code></li>
	<li><code>+page.svelte</code> — redirects <code>/&lt;deck&gt;/</code> to the first slide</li>
	<li><code>pages.ts</code> — <code>export const pages = [&#123; path: "title.html", title: "Title" &#125;]</code></li>
	<li>
		<code>title.html/</code> — the slide itself: a <code>+page.svelte</code>, and its own
		<code>+layout.js</code> with <code>trailingSlash = "never"</code>
	</li>
</ul>

<p>
	Those two <code>trailingSlash</code> values differ on purpose, and it is the one thing worth
	getting right first: the deck is addressed with a trailing slash, each slide without one. Omit
	a slide's <code>+layout.js</code> and its nav links 404.
</p>

<h2>To build a Text instead</h2>

<p>
	A Text is one long page that scrolls. Create <code>src/routes/&lt;name&gt;.html/</code> with a
	<code>+layout.js</code> (<code>trailingSlash = "never"</code>), a <code>+layout.svelte</code>
	wrapping <code>&lt;TextPage&gt;</code>, and a <code>+page.svelte</code> of prose — then add
	<code>'/&lt;name&gt;.html'</code> to <code>TEXT_ROUTES</code> in
	<code>src/lib/seo/routes.ts</code>, or it will never reach the sitemap.
</p>

<h2>Or let the script do it</h2>

<p>
	Re-running <code>adopt-geekpresent.sh --mode skeleton --kind deck</code> (or
	<code>--kind text</code>) scaffolds exactly the above, correctly. Then replace this page:
	it is just <code>src/routes/(home)/+page.svelte</code>.
</p>
