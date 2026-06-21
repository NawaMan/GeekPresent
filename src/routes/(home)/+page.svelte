<!--
  Landing / index page — served at the site root `/`.

  Built as a Text artifact (shares the TextPage shell). Its job is to say what
  GeekPresent IS and why you'd use it, then point at the artifacts. Links are
  relative to `/`, so they resolve to the sibling routes (/text.html,
  /slides/title.html, /portrait/title.html, /geeklight/title.html).
-->
<script lang="ts">
	import Label from '$lib/components/Label.svelte';
</script>

<h1>GeekPresent</h1>

<p>
	<b>Presentation slides for people who'd rather write HTML than wrestle a slide editor.</b>
</p>
<p>
	GeekPresent turns HTML, CSS, and Svelte into presentations and long-form texts:
	every slide is just a route, every component is yours to reuse, and the whole
	thing builds into a static site you can deploy to GitHub Pages in one push.
</p>

<h2>Why it exists</h2>

<p>
	If you have done any front-end work you already know HTML + CSS + JS, and 
	  you've probably have thought that it would be nice 
	    if you could just <i>use</i> that to make slides instead of fighting a WYSIWYG tool. 
	GeekPresent lets you do exactly that:
</p>

<ul>
	<li>
		<b>You already know the tools.</b> Author slides in HTML, CSS, and Svelte
		&mdash; no proprietary editor, no lock-in.
	</li>
	<li>
		<b>Fixed canvas, automatic scaling.</b> Design on a fixed
		1920&times;1080 canvas and position things with normal CSS &mdash; including
		pixel-exact absolute positioning &mdash; and the framework scales the whole
		slide to fit any screen. You think in one size; it handles the rest.
	</li>
	<li>
		<b>Real components.</b> Reusable slide pieces &mdash; boxes, code viewers,
		notes &mdash; are just imports.
	</li>
	<li>
		<b>Interactive when you want.</b> Slides are Svelte components, so state and
		events work as usual &mdash; click-to-reveal, toggles, live demos, anything
		you can do with JS.
	</li>
	<li>
		<b>Backend, if you wire it up.</b> With a bit of plumbing you can talk to a
		backend too &mdash; Svelte 5 makes that kind of thing surprisingly pleasant.
	</li>
	<li>
		<b>It's just text.</b> Slides are Svelte files, so they diff cleanly,
		version-control nicely, and hot-reload while you edit.
	</li>
	<li>
		<b>AI-friendly.</b> Because slides and texts are plain Svelte files, an AI
		agent can read, create, and adjust them for you &mdash; no opaque binary
		format to fight.
	</li>
</ul>

<h2>Two kinds of artifact</h2>

<p>
	Both are built from the same components &mdash; pick the shape that fits:
</p>

<ul>
	<li>
		<b>Presentations</b> &mdash; many fixed slides on a 1920&times;1080
		landscape canvas (or 1080&times;1920 portrait), advanced one at a time.
	</li>
	<li>
		<b>Texts</b> &mdash; one long page that flows downward, its width following
		the window up to 1080px, that you scroll at your own pace.
	</li>
</ul>

<h2>What you get</h2>

<ul>
	<li>
		<b>Navigation built in.</b> Arrow keys, an on-screen nav bar, and a
		<Label style="color: #7fd9ff;">Table of Contents</Label> &mdash; no wiring
		required.
	</li>
	<li>
		<b>SCALED / FIXED modes.</b> Present scaled-to-fit, or switch to a fixed
		1920&times;1080 view with speaker notes visible below.
	</li>
	<li>
		<b>A component toolbox.</b> Box (pop-up overlays), Code / CodeBox (Monaco
		viewers, any language), YouTube (thumbnail + QR), plus Notes, Hints, and
		Labels.
	</li>
	<li>
		<b>Per-deck themes.</b> Each presentation can carry its own fonts, colours,
		background, and favicon &mdash; light or dark.
	</li>
	<li>
		<b>Static, portable output.</b> Every route is prerendered with relative
		asset paths, so the build drops onto GitHub Pages, any static host, or
		straight off disk.
	</li>
</ul>

<h2>What makes it great</h2>

<ul>
	<li>
		<b>Fixed canvas with auto-scaling.</b> Anyone who has tried to build a raw
		HTML/CSS deck knows the nightmare of responsive design wrecking slide layouts
		across projector resolutions. Locking the design to a fixed aspect ratio
		(1920&times;1080) and auto-scaling it to fit the screen gives you the absolute
		positioning power of a traditional slide editor without losing the flexibility
		of web code.
	</li>
	<li>
		<b>Dual-purpose artifacts.</b> The same source components compile into either
		a slide deck or a long-form, scrollable text. Give the talk on stage, then
		publish a reader-friendly version as a blog post or docs page &mdash; no
		rewriting.
	</li>
	<li>
		<b>Git- and AI-friendly.</b> Plain-text Svelte/HTML files mean real version
		control &mdash; clean diffs, branches, pull requests &mdash; and they make it
		easy to point an LLM at your slides to scaffold, edit, or translate them. AI
		is far better at writing code than at generating opaque
		<code>.pptx</code> binaries.
	</li>
	<li>
		<b>Portrait mode for modern content.</b> A 1080&times;1920 layout targets
		mobile and short-form video (YouTube Shorts, TikTok) &mdash; the same
		components, a taller frame.
	</li>
</ul>

<h2>What makes it unique</h2>

<p>
	HTML-based slides aren't new &mdash; reveal.js, Slidev, Spectacle and Marp all
	exist. What no mainstream tool focuses on is the particular set of choices
	GeekPresent combines:
</p>

<ul>
	<li>
		<b>One slide = one route = one folder.</b> Slides aren't sections of a single
		giant document or fenced blocks in one markdown file &mdash; each slide is its
		own route folder. So slides diff cleanly one file at a time, each can
		<b>colocate its own assets</b> (images, QR codes) right beside it, and every
		slide is independently URL-addressable and prerendered to its own HTML.
	</li>
	<li>
		<b>A fixed canvas with pixel-exact positioning <i>and</i> auto-scaling.</b>
		You design against one fixed 1920&times;1080 size &mdash; <code>left: 960px</code>
		means the same thing on every screen &mdash; and the framework scales the whole
		canvas to fit any window. Most HTML-slide tools push you toward responsive flow;
		GeekPresent gives you a fixed pixel coordinate space and does the scaling for you.
	</li>
	<li>
		<b>Slides that are their own documentation.</b> A
		<Label style="color: #7fd9ff;">&lt;/&gt; Source</Label> button pops a slide's
		<i>own</i> source into a Monaco viewer titled with its file path &mdash; pulled
		straight from the file, so it can never drift from what you see.
	</li>
	<li>
		<b>Two artifact types from one component set.</b> The same components compile
		into either a click-through presentation or a long-form, scrollable Text &mdash;
		give the talk, then publish the reader-friendly version with no rewrite.
	</li>
	<li>
		<b>Multiple independent presentations in one project.</b> Navigation and the
		Table of Contents are scoped <i>per presentation</i>, not a single global config.
		Sibling decks each carry their own slide list, theme, fonts, background, and
		favicon, and coexist without interfering.
	</li>
	<li>
		<b>Genuinely portable, lean static output.</b> Every route prerenders with
		relative asset paths, so the build runs from GitHub Pages, any sub-path, or
		straight off disk &mdash; and the build can emit the whole site or just a single
		presentation.
	</li>
</ul>

<p>
	<b>The trade-off:</b> slide-to-slide navigation is a full page load, not
	client-side routing &mdash; so animations live <i>within</i> a slide; cross-slide
	transitions don't work out of the box. That's the cost of the route-per-slide
	design.
</p>

<h2>Explore</h2>

<p>
	The best reference is the source itself &mdash; open any slide below and read
	its <code>+page.svelte</code>.
</p>

<h3>Example Presentation</h3>
<ul>
	<li>
		<a href="slides/title.html">GeekPresent</a> &mdash; the main presentation: a
		guide to building decks with this framework.
	</li>
	<li>
		<a href="transition/title.html">Page Transitions</a> &mdash; a green-themed deck
		on animating slide-to-slide with the View Transitions API; each effect is
		performed live by paging through its own &ldquo;from &rarr; to&rdquo; pair.
	</li>
	<li>
		<a href="unique/title.html">What Makes It Unique</a> &mdash; a short deck on what
		sets GeekPresent apart from mainstream slide tools (and it demonstrates each
		point as it makes it).
	</li>
	<li>
		<a href="portrait/title.html">GeekPortrait</a> &mdash; a portrait
		1080&times;1920 deck for YouTube Shorts: same components, taller frame.
	</li>
	<li>
		<a href="geeklight/title.html">GeekLight</a> &mdash; a light-theme
		presentation: same components on a light watercolor background.
	</li>
	<li>
		<a href="seo.html">SEO &amp; social cards</a> &mdash; how every page gets real
		search and social-share metadata; the page shows off its own emitted
		<code>&lt;head&gt;</code> tags, live.
	</li>
</ul>

<h3>Text</h3>
<ul>
	<li>
		<a href="text.html">Text view</a> &mdash; a sample Text artifact: one long
		page, authored by hand, that scrolls.
	</li>
</ul>

<h2>Get started</h2>

<p>
	Clone the repo, then <code>pnpm install</code> and <code>pnpm dev</code> &mdash;
	list your slides in <code>pages.ts</code>, drop a <code>+page.svelte</code> next
	to each, and <code>pnpm build</code> when you're ready to ship. See the
	<code>README</code> for the full walkthrough.
</p>
