<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="SvgBlock" subtitle="An inline SVG that fills its box and takes the theme's ink">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>SvgBlock</b> is a Block whose drawing is <i>inline</i>, so anything drawn in <code>currentColor</code> follows <code>--svgblock-fg</code> — the theme's ink by default. An <b>ImageBlock</b> of the same file cannot: an <code>&lt;img&gt;</code> is sealed off from the page's CSS.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<script>
  import SvgBlock from '\$lib/components/SvgBlock.svelte';
  import logo from './logo.svg?raw';
<\/script>

<!-- (a) a file, imported as text -->
<SvgBlock name="logo" svg={logo} …/>

<!-- (b) shapes written in place -->
<SvgBlock name="mark" viewBox="0 0 100 100" …>
  <circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" />
</SvgBlock>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>svg</code> — markup from <code>?raw</code>; its own width/height are dropped so it fills the box</li>
			<li><code>viewBox</code> — the coordinate system of shapes written in the slot</li>
			<li><code>fit</code> — contain (default) | cover | fill</li>
			<li><code>title</code> — accessible name; leave empty for a decorative drawing</li>
			<li><code>x y width height</code> — canvas box, as on every Block</li>
	</ul>

	</div>
</ContentPage>
