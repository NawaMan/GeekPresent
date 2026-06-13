<!--
  Landing / index page — served at the site root `/`.

  Built as a Text artifact (shares the TextPage shell). Its job is to say what
  GeekPresent IS and why you'd use it, then point at the artifacts. Links are
  relative to `/`, so they resolve to the sibling routes (/text.html,
  /slides/title.html, /demo/title.html, /tall/title.html, /geeklight/title.html).
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

<h2>Explore</h2>

<p>
	The best reference is the source itself &mdash; open any slide below and read
	its <code>+page.svelte</code>.
</p>

<h3>Text</h3>
<ul>
	<li>
		<a href="text.html">Text view</a> &mdash; a sample Text artifact: one long
		page, authored by hand, that scrolls.
	</li>
</ul>

<h3>Presentations</h3>
<ul>
	<li>
		<a href="slides/title.html">GeekPresent</a> &mdash; the main presentation: a
		guide to building decks with this framework.
	</li>
	<li>
		<a href="demo/title.html">Demo</a> &mdash; a second, standalone presentation
		with its own theme.
	</li>
	<li>
		<a href="tall/title.html">GeekPortrait</a> &mdash; a portrait
		1080&times;1920 deck for YouTube Shorts: same components, taller frame.
	</li>
	<li>
		<a href="geeklight/title.html">GeekLight</a> &mdash; a light-theme
		presentation: same components on a light watercolor background.
	</li>
</ul>

<h2>Get started</h2>

<p>
	Clone the repo, then <code>pnpm install</code> and <code>pnpm dev</code> &mdash;
	list your slides in <code>pages.ts</code>, drop a <code>+page.svelte</code> next
	to each, and <code>pnpm build</code> when you're ready to ship. See the
	<code>README</code> for the full walkthrough.
</p>
