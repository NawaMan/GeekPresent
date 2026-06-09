<!--
  Sample Text artifact.

  One long page authored by hand: prose, an imported (colocated) image, code
  blocks and reused $lib components, all flowing down a fixed 1920px column.
  It is deliberately taller than one screen to show the continuous scroll.
-->
<script lang="ts">
	import Label from '$lib/components/Label.svelte';
	import diagram from './presentation-vs-text.svg';
</script>

<h1>Text view</h1>

<p>
	This page is a <Label style="color: #7fd9ff;">Text artifact</Label> — the
	second kind of thing NawaPresent builds. A presentation is many discrete
	slides, each a fixed 1920&times;1080 canvas. A Text is one single page: a fixed
	1920px wide, with a flexible height that grows as you add content. You author
	it by hand and it scrolls.
</p>

<img src={diagram} alt="A presentation is many fixed slides; a text is one long page that scrolls." />

<h2>One page, not a filmstrip</h2>

<p>
	A Text is not a stack of slides glued together — it is a document. Write as
	much as you like and the page keeps growing downward; the window scrolls. The
	page below runs well past one screen on purpose, so the continuous flow is
	easy to see. Notice the <b>TOP</b> button pinned in the corner — that is the
	navigation bar, which in a Text becomes a single jump-to-top control.
</p>

<h2>It reuses the same components</h2>

<p>
	A Text draws from the very same <code>$lib</code> component toolbox as the
	slides — the words &ldquo;Text artifact&rdquo; up top are a real
	<code>Label</code> component, hover them. Some components assume they live on
	a slide (the navigation bar, slide-anchored hints, pop-up overlays) and will
	be adapted for flowing documents one at a time; for now, prose, headings,
	lists, links, images and inline components work as you would expect.
</p>

<h2>Anatomy of a Text artifact</h2>

<p>
	A Text is its own route folder, just like a presentation — only it holds a
	single page instead of many slides:
</p>

<pre><code>src/routes/text.html/
  +layout.js       prerender = true; trailingSlash = "never"
  +layout.svelte   the Text shell: 1920-wide column, mode = 'text'
  +page.svelte     this content
  presentation-vs-text.svg   a colocated image, imported below</code></pre>

<p>
	Content is plain markup plus imported components. Assets live next to the page
	and are pulled in with <code>import</code>, so Vite bundles and hashes them:
</p>

<pre><code>&lt;script&gt;
  import Label   from '$lib/components/Label.svelte';
  import diagram from './presentation-vs-text.svg';
&lt;/script&gt;

&lt;img src=&#123;diagram&#125; alt="..." /&gt;
&lt;p&gt;Text with an inline &lt;Label&gt;highlight&lt;/Label&gt;.&lt;/p&gt;</code></pre>

<h2>Fixed width</h2>

<p>
	The column is a fixed 1920px and does not scale to the window (its
	&ldquo;FIXED&rdquo; mode). On a narrow window the page simply scrolls
	sideways, the same way a presentation&rsquo;s FIXED display shows a slide at
	native size. Because the width never changes, anything you lay out
	horizontally — columns, wide images, code — keeps its proportions on every
	screen.
</p>

<h2>Authoring</h2>

<ul>
	<li>Write content straight into this <code>+page.svelte</code>.</li>
	<li>Import components from <code>$lib/components/&hellip;</code> as usual.</li>
	<li>Colocate images/assets and <code>import</code> them.</li>
	<li>Re-theme in the artifact&rsquo;s own <code>+layout.svelte</code>.</li>
	<li>To start another Text, copy this whole route folder.</li>
</ul>

<h2>Why two formats</h2>

<p>
	The same material often wants two shapes. A talk is a sequence of slides you
	advance through, one idea per frame. An article is a continuous read you
	scroll at your own pace. Rather than force one into the other, NawaPresent
	lets you author both from the same toolbox — a presentation when you are on
	stage, a Text when someone wants to read it later.
</p>

<p>
	Keep going and you will notice there is no &ldquo;next page.&rdquo; That is the
	point: a Text is as long as it needs to be. When you reach the end, the
	<b>TOP</b> button takes you back up in one click.
</p>

<p>
	Prefer slides? Head to the <a href="../slides/title.html">presentation</a>, or
	back to the <a href="../">home page</a>.
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
	code {
		font-family: 'Fira Code', monospace;
		font-size: 0.9em;
	}
	img {
		display: block;
		width: 100%;
		max-width: 1500px;
		margin: 1.5em 0;
	}
</style>
