<!--
  SEO & Social Cards — a Text artifact that documents the SEO feature and shows
  off its own output. The "What this page emits" box reads the live <head> on
  mount, so the reader sees the exact tags THIS page prerendered — the best proof
  the feature works without a separate screenshot.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Label from '$lib/components/Label.svelte';
	import { SITE_URL } from '$lib/seo/config';

	// Read this page's own SEO/social tags straight from the document head on mount,
	// so the box below shows the REAL emitted metadata (including the absolute
	// og:url / canonical built from GEEKPRESENT_SITE_URL). Browser-only — on the
	// prerendered HTML / no-JS it stays the placeholder below.
	let emitted = '';
	onMount(() => {
		const tags = document.head.querySelectorAll(
			'title, meta[name="description"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"]'
		);
		emitted = Array.from(tags)
			.map((el) => el.outerHTML)
			.join('\n');
	});

	// What base URL this build was made with — so the page can state plainly whether
	// the absolute-only tags are present or were omitted.
	const baseUrl = SITE_URL || '(none — absolute-only tags omitted)';
</script>

<h1>SEO &amp; social cards</h1>

<p>
	Every page GeekPresent builds is <b>prerendered to static HTML</b>, so it can
	carry real search-engine and social-share metadata baked right into the file —
	no JavaScript required for a crawler to read it. This page is a
	<Label style="color: #7fd9ff;">Text artifact</Label> like any other, and it is
	itself the demo: scroll to <a href="#emitted">what this page emits</a> to see
	its own <code>&lt;head&gt;</code> tags, pulled live from the document.
</p>

<h2>What you get, automatically</h2>

<p>
	The shells (<code>SlideDeck</code> for presentations, <code>TextPage</code> for
	texts) already render a reusable <code>Seo</code> component, so every slide and
	every text emits, with no extra work:
</p>

<ul>
	<li>a <code>&lt;title&gt;</code> and a <code>meta description</code>;</li>
	<li>
		<b>OpenGraph</b> tags (<code>og:title</code>, <code>og:description</code>,
		<code>og:type</code>, <code>og:url</code>, <code>og:image</code>,
		<code>og:site_name</code>) for Facebook, LinkedIn, Slack, Discord&hellip;;
	</li>
	<li>
		<b>Twitter / X cards</b> (<code>summary_large_image</code> with title,
		description and image);
	</li>
	<li>a <code>&lt;link rel="canonical"&gt;</code>;</li>
	<li>
		a site-wide <a href="../sitemap.xml">sitemap.xml</a> and
		<a href="../robots.txt">robots.txt</a> in the build output.
	</li>
</ul>

<h2>The one knob: the base URL</h2>

<p>
	In-page assets stay <b>relative</b> so the build is portable to any sub-path or
	straight off disk. But a few metadata fields &mdash; <code>og:url</code>,
	<code>og:image</code>, <code>twitter:image</code>, <code>canonical</code> and
	the sitemap &mdash; <i>must</i> be absolute, because scrapers and search engines
	can&rsquo;t resolve a relative URL. One build-time variable supplies that base:
</p>

<pre><code># default: the project's GitHub Pages URL
pnpm build

# a custom domain
GEEKPRESENT_SITE_URL=https://my.site pnpm build

# unknown deploy URL? omit the absolute-only tags
# (no half-formed og:url ever ships)
GEEKPRESENT_SITE_URL= pnpm build</code></pre>

<p>
	This build used <code>{baseUrl}</code>. When it is empty, the absolute-only
	tags are simply left out &mdash; everything else (title, description, card type)
	still ships.
</p>

<h2>Per-deck defaults</h2>

<p>
	A presentation sets its default description (and optional social image) once, in
	its <code>+layout.svelte</code>, by passing props to <code>SlideDeck</code>:
</p>

<pre><code>&lt;SlideDeck
  &#123;pages&#125;
  title="My Talk"
  description="What this deck is about, in a sentence or two."
  image="my-talk/social.png"   &lt;!-- optional; site-relative or absolute --&gt;
  width=&#123;1920&#125; height=&#123;1080&#125;
&gt;
  &lt;slot /&gt;
&lt;/SlideDeck&gt;</code></pre>

<p>
	A Text does the same through <code>&lt;TextPage&gt;</code> &mdash; which is
	exactly what this page&rsquo;s own <code>+layout.svelte</code> does:
</p>

<pre><code>&lt;TextPage
  title="SEO &amp; Social Cards — GeekPresent"
  description="How GeekPresent gives every page real SEO metadata…"
&gt;
  &lt;slot /&gt;
&lt;/TextPage&gt;</code></pre>

<h2>Per-slide overrides</h2>

<p>
	Any single slide can override the deck defaults from its <code>pages.ts</code>
	entry &mdash; the same place it already sets its title and favicon:
</p>

<pre><code>export const pages = [
  &#123; path: "title.html", title: "Title" &#125;,
  &#123;
    path: "highlight.html",
    title: "The Big Idea",
    description: "A custom description just for this slide.",
    image: "slides/highlight-og.png"
  &#125;,
];</code></pre>

<p>
	The cascade is: <b>slide</b> value &rarr; <b>deck</b> default &rarr;
	<b>site</b> default. Images fall back to the bundled
	<a href="../og-default.png">1200&times;630 default card</a>.
</p>

<h2 id="emitted">What this page emits</h2>

<p>
	Here are the actual SEO tags in this page&rsquo;s <code>&lt;head&gt;</code> right
	now, read live from the document &mdash; the same bytes a crawler sees in the
	prerendered HTML:
</p>

{#if emitted}
	<pre class="emitted"><code>{emitted}</code></pre>
{:else}
	<pre class="emitted"><code>Reading the document head… (this box needs JavaScript; the tags
are in the prerendered HTML regardless — view source to confirm).</code></pre>
{/if}

<p>
	Notice the <code>og:url</code> and <code>canonical</code> are absolute and point
	at <i>this</i> route, while the page&rsquo;s images and assets stayed relative.
	That split is the whole trick.
</p>

<h2>Sitemap &amp; robots</h2>

<p>
	A full build also writes <a href="../sitemap.xml">sitemap.xml</a> (every
	prerendered route, as absolute URLs) and <a href="../robots.txt">robots.txt</a>
	into the output. The sitemap is generated from each presentation&rsquo;s
	<code>pages.ts</code> plus the standalone texts, so new slides are picked up
	automatically. (A single-route build &mdash; <code>build-static.sh ./out
	seo.html</code> &mdash; omits the sitemap by design.)
</p>

<p>
	That&rsquo;s the whole feature. Back to the
	<a href="../">home page</a>, or read the
	<a href="../text.html">sample Text</a> next door.
</p>

<style>
	pre {
		background: #0e1112;
		border: 1.5px solid #2a3a40;
		border-radius: 12px;
		padding: 27px 33px;
		overflow-x: auto;
		margin: 1em 0;
	}
	pre code {
		font-family: 'Fira Code', monospace;
		font-size: 0.95em;
		line-height: 1.6em;
		color: #cfe9f1;
		white-space: pre;
	}
	/* The live-output box: tint it differently so it reads as "this is real,
	   not an example you type". */
	pre.emitted {
		background: #0a1a14;
		border-color: #2f5a44;
	}
	pre.emitted code {
		color: #bdf1d6;
		white-space: pre-wrap;
		word-break: break-word;
	}
	code {
		font-family: 'Fira Code', monospace;
		font-size: 0.9em;
	}
</style>
