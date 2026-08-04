<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import Link from '$lib/components/Link.svelte';
</script>

<ContentPage title="Link" subtitle="One anchor, and a promise about where you land">
	<div style="width: 100%; line-height: 1.45; font-size: 0.92em;">
		<p>
			<b>Link</b> is the anchor every slide and Text should write. Every link wears the
			<b>same colour and the same thin dashed underline</b>; a trailing <b>glyph</b> says
			which kind it is. One family at a glance, and one character when you want to know
			where a particular link goes.
		</p>

		<Columns widths={[1, 1]} gap="1.5em" align="start" style="margin-top: 0.8em;">
			<Column>
				<ul style="margin: 0 0 0 1.1em; line-height: 1.8;">
					<li>
						<Link href="../title.html">an ordinary move inside the site</Link>
						&nbsp;— unmarked
					</li>
					<!-- A SAMPLE, not a live link: this deck has no appendix to jump into, and a
					     cross-deck AppendixLink would be resolved against the handout's <base>
					     and 404 the prerender crawler. Same declarations as the real thing. -->
					<li>
						<span class="sample">a detour you come back from<span class="marker">↩</span></span>
						&nbsp;— <code>&lt;AppendixLink&gt;</code>
					</li>
					<li>
						<Link href="https://svelte.dev">this leaves the site</Link>
						&nbsp;— auto-detected
					</li>
				</ul>
			</Column>
			<Column>
				<p style="margin: 0 0 0.35em; opacity: 0.95;"><b>It classifies itself</b></p>
				<p style="margin: 0;">
					An absolute URL, a <code>mailto:</code> or a <code>tel:</code> earns the
					<b>↗</b> and gets <code>target="_blank"</code> +
					<code>rel="noopener noreferrer"</code> — none of which the author types. That is
					the point: the glyph cannot drift from the destination.
				</p>
			</Column>
		</Columns>

		<QuickCode style="margin-top: 0.8em;" lang="svelte" code={`<Link href="./slide-pages/title.html">Open the Slide Pages reference →</Link>
<Link href="https://codingbooth.io/">codingbooth.io</Link>

<!-- ours, but it still hands you to another window -->
<Link href="/_handout/slides.html" newTab>this deck's handout</Link>`} />

		<p style="margin-top: 0.7em; opacity: 0.9;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>href</code> — the destination, exactly as an <code>&lt;a&gt;</code> takes it</li>
			<li><code>kind</code> — <code>auto</code> (default) | <code>internal</code> | <code>external</code>, for when the URL lies</li>
			<li><code>newTab</code> — force the window; forcing it <b>on</b> also earns the ↗, because the reader does leave</li>
			<li><code>glyph</code> / <code>icon</code> — hide the glyph, or replace it with your own</li>
		</ul>

		<Callout kind="info" title="Colour is the theme's, not the slide's" style="margin-top: 0.75em;">
			One role token — <code>--link-fg</code> — colours every link, so a theme moves it
			once. Don't hand-set a link colour on a slide: that is exactly the drift this
			component exists to end.
		</Callout>
	</div>
</ContentPage>

<style>
	/* The AppendixLink sample above — the same five declarations Link and AppendixLink
	   share, so the card shows the real thing rather than an approximation. */
	.sample {
		color: var(--appendix-link-fg, var(--link-fg, #58A6FF));
		text-decoration: underline;
		text-decoration-style: dashed;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
	}
	.sample .marker {
		display: inline-block;
		margin-left: 0.15em;
		font-size: 0.85em;
	}
</style>
