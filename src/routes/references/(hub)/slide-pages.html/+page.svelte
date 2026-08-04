<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Columns from '$lib/components/Columns.svelte';
	import Column from '$lib/components/Column.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Link from '$lib/components/Link.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { appendixHref, readReturnStack, slidePathOf } from '$lib/utils/appendixCore';

	// Stamp this hub card as ?return= so Slide Pages CATALOG / ↑ / Backspace
	// come back here (not only to the catalog root). Carry any outer stack too —
	// but only in the browser: reading url.searchParams at prerender is a hard
	// error, and a prerendered page has no query string to carry anyway. Same
	// guard as AppendixLink and slide-pages/closing.html.
	$: href = appendixHref(
		'slide-pages/title.html',
		slidePathOf($page.url.pathname),
		browser ? readReturnStack($page.url.searchParams) : []
	);
</script>

<ContentPage title="Slide Pages" subtitle="Full-page templates & full-canvas slides">
	<div style="width: 100%; line-height: 1.45; font-size: 0.90em;">
		<p>
			<b>Slide Pages</b> are the shapes of a whole slide — pick a shell, fill it,
			or jump into a full-bleed media surface. This group is the map of those
			shapes; each entry below has a dedicated slide (and some have live demos).
		</p>

		<Columns widths={[1, 1]} gap="1.6em" align="start" style="margin-top: 0.85em;">
			<Column>
				<p style="margin: 0 0 0.35em; opacity: 0.95;"><b>Document shells</b></p>
				<ul style="margin: 0 0 0 1.1em; line-height: 1.5;">
					<li><b>TitlePage</b> — centered cover (title / subtitle / subsubtitle)</li>
					<li><b>ContentPage</b> — titled body; most reference slides use this</li>
					<li><b>EmptyPage</b> — full canvas, no header (Blocks &amp; free layout)</li>
				</ul>

				<p style="margin: 0.85em 0 0.35em; opacity: 0.95;"><b>Detours</b></p>
				<ul style="margin: 0 0 0 1.1em; line-height: 1.5;">
					<li><b>AppendixPage</b> + <b>AppendixLink</b> — call in, RETURN out</li>
					<li><code>hidden: true</code> — off the linear march, still linkable</li>
				</ul>
			</Column>
			<Column>
				<p style="margin: 0 0 0.35em; opacity: 0.95;"><b>Full-canvas media</b></p>
				<ul style="margin: 0 0 0 1.1em; line-height: 1.5;">
					<li><b>WebPage</b> — live site; shield + highlighted Release</li>
					<li><b>VideoPage</b> — full-stage player; optional bookmarks</li>
					<li>Live demos open as <b>appendices</b> from the docs slides</li>
				</ul>

				<p style="margin: 0.85em 0 0.35em; opacity: 0.95;"><b>Not a slide</b></p>
				<ul style="margin: 0 0 0 1.1em; line-height: 1.5;">
					<li><b>TextPage</b> — long-scroll Text artifact (own route, not <code>pages.ts</code>)</li>
				</ul>
			</Column>
		</Columns>

		<Callout kind="tip" title="How to use this group" style="margin-top: 0.9em;">
			Open the deck, page through in order, try every live AppendixLink.
			On the closing slide, <b>RETURN</b> (or ↑ / Backspace) brings you back
			to <i>this</i> hub card — the link below stamps that return address.
		</Callout>

		<p style="margin-top: 0.9em; font-size: 1.1em;">
			<Link {href}>Open the Slide Pages reference →</Link>
		</p>
	</div>
</ContentPage>
