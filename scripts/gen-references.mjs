/**
 * One-shot scaffold for /references hub + group decks.
 * Fresh copy only — does not read or port slides/ demos.
 *
 * Run from worktree root: node scripts/gen-references.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const routes = join(root, 'src/routes/references');

const LAYOUT_JS = `export const prerender = true;
export const trailingSlash = "never";
`;

const REDIRECT = `<script>
	if (typeof window !== 'undefined') {
		window.location.href = (window.location.pathname + '/title.html').replaceAll('//', '/');
	}
</script>

<div>
	<h1>This page will redirect. Click <a href="title.html">here</a> if it does not.</h1>
</div>
`;

function deckLayout({ title, description, articleHref, articleText, extras = '' }) {
	return `<!--
  ${title} — component reference deck.
  Fresh reference material (not ported from the product-tour slides).
-->
<script lang="ts">
	import SlideDeck    from '$lib/components/SlideDeck.svelte';
	import { pages }    from './pages';
	import { setPages } from '$lib/presentation';
	import favicon from '$lib/assets/codecat-zoom.png';

	setPages(pages);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SlideDeck
	{pages}
	title=${JSON.stringify(title)}
	description=${JSON.stringify(description)}
	width={1920}
	height={1080}
	fill
	article
	articleText=${JSON.stringify(articleText)}
	articleHref=${JSON.stringify(articleHref)}
	fadeChrome
${extras}>
	<slot />
</SlideDeck>
`;
}

function write(path, content) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
	console.log('write', path.replace(root + '/', ''));
}

function slideFiles(dir, name, pageSvelte) {
	const folder = join(dir, name.endsWith(".html") ? name : `${name}.html`);
	write(join(folder, '+layout.js'), LAYOUT_JS);
	write(join(folder, '+page.svelte'), pageSvelte);
}

function titleSlide({ title, subtitle, blurb, nextHint }) {
	return `<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<svelte:fragment slot="title">${esc(title)}</svelte:fragment>
	<svelte:fragment slot="subtitle">${esc(subtitle)}</svelte:fragment>
	<svelte:fragment slot="subsubtitle">${esc(blurb)}</svelte:fragment>
</TitlePage>
${nextHint ? `\n<!-- ${nextHint} -->\n` : ''}`;
}

function refSlide({ title, subtitle, body, snippet, props, gotcha, live = '' }) {
	const propLines = (props || [])
		.map((p) => `\t\t\t<li><code>${esc(p.name)}</code> — ${esc(p.desc)}</li>`)
		.join('\n');
	const gotchaBlock = gotcha
		? `
	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		${gotcha}
	</Callout>`
		: '';
	const snippetBlock = snippet
		? `
	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={\`${snippet.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`} />`
		: '';
	const propsBlock =
		props && props.length
			? `
	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
${propLines}
	</ul>`
			: '';

	return `<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
${live}
</script>

<ContentPage title=${JSON.stringify(title)} subtitle=${JSON.stringify(subtitle)}>
	<div style="width: 100%; line-height: 1.5;">
		${body}
${snippetBlock}
${propsBlock}
${gotchaBlock}
	</div>
</ContentPage>
`;
}

function esc(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function pagesTs(entries) {
	const lines = entries.map((e) => {
		const extra = e.adjust ? ', adjust: true' : '';
		return `\t{ path: ${JSON.stringify(e.path)}, title: ${JSON.stringify(e.title)}${extra} },`;
	});
	return `// Component reference deck — ordering is the reading order.
export const pages = [
${lines.join('\n')}
];
`;
}

// ─── Catalog ───────────────────────────────────────────────────────────────

const groups = [
	{
		slug: 'slide-pages',
		title: 'Slide Pages',
		hubSubtitle: 'Slide and Text templates',
		hubBody: `<p><b>Shell</b> components wrap a whole page. You almost never invent a new outer chrome — you pick a template and fill slots or the default slot.</p>
		<p style="margin-top: 0.6em;">Use this group when you are starting a deck, a Text, or an appendix detour.</p>
		<p style="margin-top: 1em;"><a href="./slide-pages/title.html">Open the Slide Pages reference →</a></p>`,
		deckTitle: 'References — Slide Pages',
		deckDesc: 'GeekPresent slide page templates: TitlePage, ContentPage, AppendixPage, TextPage.',
		components: [
			{
				path: 'titlepage.html',
				title: 'TitlePage',
				subtitle: 'Opening slide with three named slots',
				body: `<p><b>TitlePage</b> is the cover of a deck. It centres three named slots — title, subtitle, subsubtitle — and wires the nav bar for free.</p>
		<p style="margin-top: 0.5em;">Prefer slots over inventing your own hero layout so every deck opens with a consistent vertical rhythm.</p>`,
				snippet: `<TitlePage>
  <svelte:fragment slot="title">Talk Title</svelte:fragment>
  <svelte:fragment slot="subtitle">One-line promise</svelte:fragment>
  <svelte:fragment slot="subsubtitle">You · Event · Year</svelte:fragment>
</TitlePage>`,
				props: [
					{ name: 'nav', desc: 'pass false to hide the navigation bar' }
				]
			},
			{
				path: 'contentpage.html',
				title: 'ContentPage',
				subtitle: 'Standard body slide',
				body: `<p><b>ContentPage</b> is the default workhorse: a title, optional subtitle, and a default slot for the body. Nav is included unless you opt out.</p>
		<p style="margin-top: 0.5em;">Put prose and flowing layouts in the slot; pin pixel-exact pieces with Block outside or inside as needed.</p>`,
				snippet: `<ContentPage title="Topic" subtitle="Optional cue">
  <p>Body content goes here.</p>
</ContentPage>`,
				props: [
					{ name: 'title / subtitle', desc: 'header strings (subtitle optional)' },
					{ name: 'nav', desc: 'false drops the bottom navigation bar' }
				]
			},
			{
				path: 'appendixpage.html',
				title: 'AppendixPage',
				subtitle: 'A detour you jump into and return from',
				body: `<p><b>AppendixPage</b> models a book appendix: enter via <code>AppendixLink</code>, page through a run, leave with RETURN or by paging off the end.</p>
		<p style="margin-top: 0.5em;">Mark contiguous <code>hidden: true</code> entries in <code>pages.ts</code> so the linear march skips them; leave <code>hidden</code> off for listed back matter.</p>`,
				snippet: `<!-- caller -->
<AppendixLink to="deep-dive.html">see details</AppendixLink>

<!-- deep-dive.html -->
<AppendixPage title="Deep dive">
  <p>Detail that would slow the main talk.</p>
</AppendixPage>`,
				props: [
					{ name: 'transition', desc: 'opt-in vertical transition (set on link and page)' },
					{ name: 'title / subtitle', desc: 'same idea as ContentPage' }
				],
				gotcha: 'Animated appendices use client-side navigation — prefer <code>SourceView</code> / <code>QuickCode</code>, not Monaco <code>Code</code> / <code>ViewSource</code>.'
			},
			{
				path: 'textpage.html',
				title: 'TextPage',
				subtitle: 'Long-form scrollable artifact',
				body: `<p><b>TextPage</b> is the shell for a <b>Text</b>: one fluid column (window width, capped at 1080px) you scroll. It calls <code>setMode('text')</code> so shared components adapt (e.g. nav collapses to TOP).</p>
		<p style="margin-top: 0.5em;">A Text is a route with a tiny layout that wraps <code>&lt;TextPage&gt;</code> around the slot — see the site home and <code>text.html</code>.</p>`,
				snippet: `<!-- +layout.svelte of a Text route -->
<script>
  import TextPage from '$lib/components/TextPage.svelte';
</script>
<TextPage>
  <slot />
</TextPage>`,
				props: [
					{ name: '(children)', desc: 'the Text body; typography is authored per page' }
				]
			},
			{
				path: 'appendixlink.html',
				title: 'AppendixLink',
				subtitle: 'Call into an appendix with a return address',
				body: `<p><b>AppendixLink</b> is the call site for an appendix. It stamps the current slide as <code>?return=</code> so the appendix can send the reader back without hard-coding a path.</p>`,
				snippet: `<AppendixLink to="appendix-gc.html">how the GC marks</AppendixLink>`,
				props: [
					{ name: 'to', desc: 'target slide path within the same deck' },
					{ name: 'transition', desc: 'match AppendixPage when you want the vertical motion' }
				]
			}
		]
	},
	{
		slug: 'layout',
		title: 'Layout',
		hubSubtitle: 'Place, size, connect',
		hubBody: `<p><b>Layout</b> is how you put things at exact canvas pixels and relate them: Blocks, images, columns, scroll regions, and named connectors.</p>
		<p style="margin-top: 0.6em;">ADJUST mode is the authoring aid that makes these numbers honest — drag in the browser, then SAVE (dev) or Copy.</p>
		<p style="margin-top: 1em;"><a href="./layout/title.html">Open the Layout reference →</a></p>`,
		deckTitle: 'References — Layout',
		deckDesc: 'GeekPresent layout: Block, ImageBlock, Connector, Columns, ScrollDiv, ADJUST.',
				components: [
			{
				path: 'block.html',
				title: 'Block',
				subtitle: 'Absolute box in canvas pixels',
				body: `<p><b>Block</b> pins children at <code>x</code>/<code>y</code> with a fixed <code>width</code>/<code>height</code> in the deck canvas (default 1920×1080). Everything scales with the slide transform.</p>
		<p style="margin-top: 0.5em;">Give it a <code>name</code> when Connectors, Spotlight, or Toast need to find it.</p>`,
				snippet: `<Block name="hero" x={120} y={240} width={400} height={160}>
  <h2>Pinned content</h2>
</Block>`,
				props: [
					{ name: 'x y width height', desc: 'canvas pixels' },
					{ name: 'name', desc: 'label + registry key for connectors / highlights' },
					{ name: 'grid / aspect / bounds', desc: 'snap, lock aspect, clamp to canvas' },
					{ name: 'fill', desc: 'false keeps natural content size' }
				]
			},
			{
				path: 'imageblock.html',
				title: 'ImageBlock',
				subtitle: 'Absolute image with resize behaviour',
				body: `<p><b>ImageBlock</b> is a Block specialised for a picture: the image fills the panel; aspect is locked by default (Alt to break while resizing in ADJUST).</p>
		<p style="margin-top: 0.5em;">Always <code>import</code> the asset so the build hashes it and respects base paths.</p>`,
				snippet: `<script>
  import ImageBlock from '$lib/components/ImageBlock.svelte';
  import photo from './photo.png';
</script>
<ImageBlock src={photo} alt="Demo" x={760} y={400} width={400} height={300} />`,
				props: [
					{ name: 'src / alt', desc: 'image source (imported) and accessible text' },
					{ name: 'x y width height', desc: 'canvas box' },
					{ name: 'aspect', desc: 'true | number | false' }
				]
			},
			{
				path: 'connector.html',
				title: 'Connector',
				subtitle: 'Arrows by name, not coordinates',
				body: `<p><b>Connector</b> routes an arrow between two named Blocks (or raw points). Drag a Block in ADJUST and the arrow follows — you never recompute endpoints.</p>
		<p style="margin-top: 0.5em;"><b>Order matters:</b> Connectors must appear after the Blocks they link so names exist during registration.</p>`,
				snippet: `<Block name="api" x={200} y={400} width={280} height={140}>API</Block>
<Block name="db"  x={900} y={400} width={280} height={140}>DB</Block>
<Connector from="api" to="db" label="query" />`,
				props: [
					{ name: 'from / to', desc: 'Block name, point [x,y], or box' },
					{ name: 'route', desc: 'straight | ortho | curve' },
					{ name: 'fromSide / toSide', desc: 'top | right | bottom | left' },
					{ name: 'label / dash / drawDelay', desc: 'caption, stroke style, stagger' }
				]
			},
			{
				path: 'columns.html',
				title: 'Columns & Column',
				subtitle: 'Grid splits, optional live gutters',
				body: `<p><b>Columns</b> lays out <b>Column</b> children on a simple grid. Unequal <code>widths</code> make a media/text split without a second component.</p>
		<p style="margin-top: 0.5em;">Pass <code>resizable</code> so viewers (and ADJUST) can drag gutters; copy the ratio chip back into source — a drag does not auto-save.</p>`,
				snippet: `<Columns widths={[1, 2]} gap="1.5em">
  <Column>Sidebar</Column>
  <Column>Main copy</Column>
</Columns>`,
				props: [
					{ name: 'widths', desc: 'relative fractions per column' },
					{ name: 'gap', desc: 'gutter size' },
					{ name: 'resizable', desc: 'viewer-draggable gutters' }
				]
			},
			{
				path: 'scrolldiv.html',
				title: 'ScrollDiv & WideDiv',
				subtitle: 'Overflow that can pan',
				body: `<p><b>ScrollDiv</b> is a wheel-pannable region for content larger than its box. Set <code>axis</code> to <code>x</code>, <code>y</code>, or <code>both</code>. <b>WideDiv</b> is the <code>axis="x"</code> alias.</p>`,
				snippet: `<ScrollDiv axis="y" style="height: 420px; width: 800px;">
  <!-- tall content -->
</ScrollDiv>`,
				props: [
					{ name: 'axis', desc: 'x | y | both' },
					{ name: 'scrollbar', desc: 'optional draggable scrollbar affordance' }
				]
			},
			{
				path: 'adjust.html',
				title: 'ADJUST mode',
				adjust: true,
				subtitle: 'Authoring aid for pixel placement',
				body: `<p><b>ADJUST</b> is not a component you import — it is a mode on the deck. In dev it is always offered; in a build, opt in with <code>adjust: true</code> on a <code>pages.ts</code> entry or sticky <code>?adjust</code>.</p>
		<p style="margin-top: 0.5em;">Drag Blocks, Copy the tag, or SAVE in <code>pnpm dev</code>. On a static host SAVE refuses with NOT ALLOWED — Copy still works.</p>`,
				snippet: `// pages.ts — offer ADJUST on a teaching slide
{ path: "diagram.html", title: "Diagram", adjust: true }`,
				props: [
					{ name: 'precedence', desc: 'dev > ?adjust / ?adjust=off > pages.ts adjust > off' }
				],
				gotcha: 'SAVE only rewrites tags it can place confidently. Expression geometry and twin samples can yield partial writes — the button reports tallies like <code>1 OF 2</code>.'
			}
		]
	},
	{
		slug: 'content',
		title: 'Content',
		hubSubtitle: 'Emphasis, structure, chrome cues',
		hubBody: `<p><b>Content</b> components are the everyday slide vocabulary: callouts, quotes, stats, timelines, tabs, steps, hints, notes, and more.</p>
		<p style="margin-top: 1em;"><a href="./content/title.html">Open the Content reference →</a></p>`,
		deckTitle: 'References — Content',
		deckDesc: 'GeekPresent content components: Callout, Quote, Stat, Timeline, Tabs, Steps, and more.',
		components: [
			{
				path: 'callout.html',
				title: 'Callout',
				subtitle: 'Semantic admonition',
				body: `<p><b>Callout</b> flags a passage as info, tip, warning, or danger — left rule, tinted panel, badge. Themes recolour via role tokens.</p>`,
				snippet: `<Callout kind="warn" title="Gotcha">
  Client-side navigation blanks Monaco — use SourceView there.
</Callout>`,
				props: [
					{ name: 'kind', desc: 'info | tip | warn | danger' },
					{ name: 'title / icon', desc: 'heading and badge override' }
				]
			},
			{
				path: 'quote.html',
				title: 'Quote',
				subtitle: 'Pull quote with attribution',
				body: `<p><b>Quote</b> presents a short quotation with optional citation. Use it for a human voice on an otherwise technical slide.</p>`,
				snippet: `<Quote cite="Grace Hopper">
  The most dangerous phrase is "We've always done it this way."
</Quote>`,
				props: [{ name: 'cite', desc: 'attribution line' }]
			},
			{
				path: 'stat.html',
				title: 'Stat & StatGroup',
				subtitle: 'Big numbers in a row',
				body: `<p><b>Stat</b> is a single metric (value + label). <b>StatGroup</b> arranges several Stats with consistent spacing for dashboards and result slides.</p>`,
				snippet: `<StatGroup>
  <Stat value="3×" label="faster builds" />
  <Stat value="0" label="runtime servers" />
</StatGroup>`,
				props: [
					{ name: 'value / label', desc: 'primary figure and caption' }
				]
			},
			{
				path: 'timeline.html',
				title: 'Timeline & TimelineItem',
				subtitle: 'Sequence of events',
				body: `<p><b>Timeline</b> lays out <b>TimelineItem</b> entries vertically or horizontally. Pair with ScrollDiv when the history is long.</p>`,
				snippet: `<Timeline>
  <TimelineItem when="2024" title="Prototype">First static deck.</TimelineItem>
  <TimelineItem when="2025" title="References">This catalog.</TimelineItem>
</Timeline>`,
				props: [
					{ name: 'orientation', desc: 'vertical (default) or horizontal' },
					{ name: 'when / title', desc: 'on each TimelineItem' }
				]
			},
			{
				path: 'tabs.html',
				title: 'Tabs & Tab',
				subtitle: 'One panel visible at a time',
				body: `<p><b>Tabs</b> collects <b>Tab</b> children into a strip + panel. Good for API vs CLI vs config without leaving the slide.</p>`,
				snippet: `<Tabs>
  <Tab label="API">REST shape…</Tab>
  <Tab label="CLI">flags…</Tab>
</Tabs>`,
				props: [{ name: 'label', desc: 'on each Tab — the strip text' }]
			},
			{
				path: 'carousel.html',
				title: 'Carousel & CarouselItem',
				subtitle: 'Paged horizontal showcase',
				body: `<p><b>Carousel</b> steps through <b>CarouselItem</b> panels — screenshots, quotes, or mini case studies — without changing the deck page.</p>`,
				snippet: `<Carousel>
  <CarouselItem>First panel</CarouselItem>
  <CarouselItem>Second panel</CarouselItem>
</Carousel>`,
				props: [{ name: '(items)', desc: 'one CarouselItem per panel' }]
			},
			{
				path: 'steps.html',
				title: 'Steps & Fragment',
				subtitle: 'Build reveals on one slide',
				body: `<p><b>Steps</b> drives progressive disclosure. <b>Fragment</b> (or step-gated children) appears as the speaker advances — Space semantics integrate with kiosk and the animation bar where relevant.</p>`,
				snippet: `<Steps>
  <Fragment>First point</Fragment>
  <Fragment>Second point</Fragment>
</Steps>`,
				props: [
					{ name: 'active / keys', desc: 'control which step is shown and keyboard bindings' }
				]
			},
			{
				path: 'box.html',
				title: 'Box',
				subtitle: 'Expandable overlay',
				body: `<p><b>Box</b> is a modal-like overlay that expands over the slide for detail (image, long code, digression) and dismisses on close or key.</p>`,
				snippet: `<script>
  let open = false;
</script>
<button on:click={() => (open = true)}>Detail</button>
<Box bind:expanded={open} width={900} height={500}>
  <!-- overlay body -->
</Box>`,
				props: [
					{ name: 'expanded', desc: 'bindable open state' },
					{ name: 'width / height', desc: 'overlay size in canvas px' }
				]
			},
			{
				path: 'hint.html',
				title: 'Hint',
				subtitle: 'Quiet cue at the edge',
				body: `<p><b>Hint</b> is a low-emphasis prompt (often bottom-of-slide): “press Space”, “scan the QR”, “next is live demo”. It is not a speaker note.</p>`,
				snippet: `<Hint>Press Space to reveal the next step</Hint>`,
				props: [{ name: 'style / class', desc: 'placement tweaks when needed' }]
			},
			{
				path: 'note.html',
				title: 'Note',
				subtitle: 'Speaker notes',
				body: `<p><b>Note</b> holds speaker script. Visible under the canvas in SCALED (zoomed out) mode and in the presenter console / handout with notes. Marked <code>no-print</code> on the live slide chrome path as appropriate.</p>`,
				snippet: `<Note>
  <p>Remind them why static hosting rules out server routes.</p>
</Note>`,
				props: [
					{ name: 'data-trigger', desc: 'optional name for Cursor / spotlight cues from the console' }
				],
				gotcha: 'The CSS class <code>.note</code> is reserved globally. Do not put <code>class="note"</code> on ordinary slide copy — use another name (e.g. <code>.cue</code>).'
			},
			{
				path: 'label.html',
				title: 'Label',
				subtitle: 'Inline hover highlight',
				body: `<p><b>Label</b> marks a term in running text so hover (or focus) emphasises it — glossary-lite without a modal.</p>`,
				snippet: `Open the <Label>Table of Contents</Label> to jump.`,
				props: [{ name: 'style', desc: 'optional colour / emphasis override' }]
			},
			{
				path: 'kbd.html',
				title: 'Kbd',
				subtitle: 'Keyboard glyph',
				body: `<p><b>Kbd</b> renders a key or chord in a platform-aware way (Mod becomes ⌘ / Ctrl as appropriate).</p>`,
				snippet: `Undo with <Kbd keys="Mod+Z" />.`,
				props: [
					{ name: 'keys', desc: 'chord string, e.g. Mod+Shift+R' },
					{ name: '(slot)', desc: 'or nest text for a custom cap' }
				]
			},
			{
				path: 'toast.html',
				title: 'Toast',
				subtitle: 'Transient banner ± spotlight',
				body: `<p><b>Toast</b> raises a short message that auto-dismisses. Optional <code>highlight</code> dims the slide around a named Block on the same beat.</p>`,
				snippet: `<Toast open={ok} highlight="deploy" text="Deployed!" onclose={() => (ok = false)} />`,
				props: [
					{ name: 'open / text / duration', desc: 'visibility, copy, ms (0 = sticky)' },
					{ name: 'highlight / placement', desc: 'Block name; top/bottom placement' }
				]
			},
			{
				path: 'qrcode.html',
				title: 'QRCode',
				subtitle: 'Scannable link on the canvas',
				body: `<p><b>QRCode</b> encodes a string as SVG (no network). Prefer it over committing a PNG. Values that look like http/mailto/tel become links.</p>`,
				snippet: `<QRCode value="https://example.com/talk" size={220} />`,
				props: [
					{ name: 'value', desc: 'payload text' },
					{ name: 'size', desc: 'pixel size of the symbol' }
				]
			},
			{
				path: 'progressbar.html',
				title: 'ProgressBar',
				subtitle: 'How far through the deck',
				body: `<p><b>ProgressBar</b> reads <code>getProgress()</code> after the deck calls <code>setPages</code>. No props required for the default bar. Tag it <code>gp-chrome no-print</code> in a layout so captures omit it.</p>`,
				snippet: `<!-- deck +layout.svelte, after setPages -->
<ProgressBar class="gp-chrome no-print" />`,
				props: [
					{ name: '(none required)', desc: 'uses presentation context' }
				]
			},
			{
				path: 'highlight.html',
				title: 'Highlight',
				subtitle: 'Punch-out emphasis on a Block',
				body: `<p><b>Highlight</b> dims the canvas and rings a named Block — author-planned emphasis. For freehand mid-talk marks, use Annotate under Features.</p>`,
				snippet: `<Highlight target="api" active={step === 2} />`,
				props: [
					{ name: 'target', desc: 'Block name' },
					{ name: 'active', desc: 'whether the dim + ring is shown' }
				]
			}
		]
	},
	{
		slug: 'code',
		title: 'Code',
		hubSubtitle: 'Snippets, editors, terminal, source',
		hubBody: `<p><b>Code</b> components range from tiny Shiki snippets to full Monaco editors, diffs, a fake terminal, and in-slide source viewers.</p>
		<p style="margin-top: 0.6em;">Rule of thumb: if the slide can be reached by client-side navigation (View Transitions, animated appendix), avoid Monaco — use QuickCode, CssSnippet, or SourceView.</p>
		<p style="margin-top: 1em;"><a href="./code/title.html">Open the Code reference →</a></p>`,
		deckTitle: 'References — Code',
		deckDesc: 'GeekPresent code components: QuickCode, Monaco viewers, CodeDiff, Terminal, ViewSource, SourceView.',
		components: [
			{
				path: 'quickcode.html',
				title: 'QuickCode',
				subtitle: 'Small highlighted snippet',
				body: `<p><b>QuickCode</b> is the default for short samples on a slide. Shiki highlighting, no CDN editor, safe under client-side navigation.</p>`,
				snippet: `<QuickCode lang="svelte" code={\`<Note>
  <p>Say this aloud.</p>
</Note>\`} />`,
				props: [
					{ name: 'code / lang', desc: 'source string and Shiki language id' }
				]
			},
			{
				path: 'csssnippet.html',
				title: 'CssSnippet',
				subtitle: 'CSS samples without Monaco',
				body: `<p><b>CssSnippet</b> is for stylesheets and design-token samples when you need something lighter than Code and safer than Monaco on SPA-style decks.</p>`,
				snippet: `<CssSnippet code={'.hero { color: var(--ACCENT); }'} />`,
				props: [{ name: 'code', desc: 'CSS text' }]
			},
			{
				path: 'code.html',
				title: 'Code & JavaCode',
				subtitle: 'Monaco read-only editors',
				body: `<p><b>Code</b> embeds Monaco for any language; <b>JavaCode</b> is the Java-tuned variant. Ideal for long listings with fold and scroll.</p>`,
				snippet: `<Code language="typescript" code={src} width="900px" height="480px" />`,
				props: [
					{ name: 'code / language', desc: 'buffer and Monaco language id' },
					{ name: 'width / height', desc: 'editor chrome size' }
				],
				gotcha: 'Monaco loads from a CDN and does not survive client-side navigations cleanly — blank editor after <code>goto</code>. Use SourceView / QuickCode on those decks.'
			},
			{
				path: 'codebox.html',
				title: 'CodeBox & JavaCodeBox',
				subtitle: 'Monaco inside a Box',
				body: `<p><b>CodeBox</b> / <b>JavaCodeBox</b> combine the expandable Box overlay with a Monaco buffer — open for detail, close to return to the slide.</p>`,
				snippet: `<CodeBox language="js" code={src} width={1000} height={560} />`,
				props: [
					{ name: 'expanded', desc: 'optional bindable open state' },
					{ name: 'code / language', desc: 'same as Code' }
				]
			},
			{
				path: 'codediff.html',
				title: 'CodeDiff',
				subtitle: 'Before / after as a diff',
				body: `<p><b>CodeDiff</b> shows two buffers as a unified or split diff — refactors and migrations on one slide.</p>`,
				snippet: `<CodeDiff before={oldSrc} after={newSrc} language="ts" />`,
				props: [
					{ name: 'before / after', desc: 'old and new source strings' },
					{ name: 'language', desc: 'highlighter language' }
				]
			},
			{
				path: 'terminal.html',
				title: 'Terminal',
				subtitle: 'Scripted fake console',
				body: `<p><b>Terminal</b> types commands and prints output on a pure CSS timeline — seekable, with a transport. Space can step commands then page the deck when <code>keys="global"</code>.</p>`,
				snippet: `<Terminal
  commands={[
    { in: 'pnpm build', out: '✓ built in 3.1s' }
  ]}
/>`,
				props: [
					{ name: 'commands', desc: 'list of input / output steps' },
					{ name: 'keys / controls', desc: 'keyboard integration; hide built-in transport if AnimationBar owns time' }
				],
				gotcha: 'Do not put both a free-running Terminal transport and an AnimationBar on the same clock without coordinating — pass <code>controls={false}</code> if the bar owns playback.'
			},
			{
				path: 'viewsource.html',
				title: 'ViewSource',
				subtitle: 'Monaco source panel + EDIT',
				body: `<p><b>ViewSource</b> registers the slide’s source (<code>?raw</code>) for ☰ → SOURCE / EDIT. In dev, SAVE can write the buffer back; on a static host SAVE refuses.</p>
		<p style="margin-top: 0.5em;">In modern dev, SOURCE/EDIT are also available deck-wide via the shell; a mounted ViewSource still supplies bytes for static hosts.</p>`,
				snippet: `<script>
  import ViewSource from '$lib/components/ViewSource.svelte';
  import source from './+page.svelte?raw';
</script>
<ViewSource {source} path="src/routes/…/+page.svelte" />`,
				props: [
					{ name: 'source / path', desc: 'raw file text and display path' }
				]
			},
			{
				path: 'sourceview.html',
				title: 'SourceView',
				subtitle: 'Shiki source panel (SPA-safe)',
				body: `<p><b>SourceView</b> is the client-navigation-safe counterpart to ViewSource’s in-slide panel: Shiki instead of Monaco. EDIT still opens the unscaled popup editor.</p>`,
				snippet: `<SourceView {source} path="src/routes/…/+page.svelte" />`,
				props: [
					{ name: 'source / path', desc: 'same contract as ViewSource' }
				],
				gotcha: 'On View-Transition decks and animated appendices, prefer SourceView over ViewSource for the in-slide panel.'
			}
		]
	},
	{
		slug: 'media',
		title: 'Media',
		hubSubtitle: 'Video, embeds, QR companions',
		hubBody: `<p><b>Media</b> covers YouTube cards, iframe embeds, full-canvas web/video pages, and the themed video player with bookmarks.</p>
		<p style="margin-top: 1em;"><a href="./media/title.html">Open the Media reference →</a></p>`,
		deckTitle: 'References — Media',
		deckDesc: 'GeekPresent media: YouTube, WebSite, WebPage, Video, VideoPage.',
		components: [
			{
				path: 'youtube.html',
				title: 'YouTube',
				subtitle: 'Thumbnail card with optional QR',
				body: `<p><b>YouTube</b> shows a talk thumbnail and links out to the video. Generate colocated assets with <code>utils/prepare-youtube.sh</code>, or rely on the optional QR pipeline / QRCode component.</p>`,
				snippet: `<YouTube {thumbnail} youtubeId="dQw4w9WgXcQ" alt="Talk" width="600px" />`,
				props: [
					{ name: 'youtubeId', desc: 'video id' },
					{ name: 'thumbnail / qr', desc: 'imported images; qr optional' }
				],
				gotcha: 'CAPTURE cannot rasterise cross-origin iframes. A slide whose main point is an embed may refuse PNG capture — expected, not broken.'
			},
			{
				path: 'website.html',
				title: 'WebSite',
				subtitle: 'Embedded site in a frame',
				body: `<p><b>WebSite</b> iframes a URL inside the canvas for live docs or apps during a talk.</p>`,
				snippet: `<WebSite src="https://example.com" width="1200px" height="700px" />`,
				props: [
					{ name: 'src', desc: 'page URL' },
					{ name: 'width / height', desc: 'frame size' }
				]
			},
			{
				path: 'webpage.html',
				title: 'WebPage',
				subtitle: 'Full-canvas embedded site',
				body: `<p><b>WebPage</b> is the full-bleed counterpart: the site is the slide, with deck nav chrome as configured.</p>`,
				snippet: `<WebPage src="https://example.com/docs" />`,
				props: [{ name: 'src', desc: 'page URL' }]
			},
			{
				path: 'video.html',
				title: 'Video',
				subtitle: 'Player with time bookmarks',
				body: `<p><b>Video</b> plays a colocated file with themed chrome and optional chapter bookmarks that seek and highlight.</p>`,
				snippet: `<script>
  import clip from './demo.mp4';
</script>
<Video src={clip} bookmarks={[
  { t: 0, label: 'Intro' },
  { t: 12, label: 'Demo' }
]} />`,
				props: [
					{ name: 'src', desc: 'imported media URL' },
					{ name: 'bookmarks', desc: 'time markers with labels' }
				]
			},
			{
				path: 'videopage.html',
				title: 'VideoPage',
				subtitle: 'Full-canvas video slide',
				body: `<p><b>VideoPage</b> fills the canvas with the player (nav included by default). Variants: bare chrome-off, autoplay for booth loops.</p>`,
				snippet: `<VideoPage src={clip} autoplay muted />`,
				props: [
					{ name: 'src / autoplay / muted', desc: 'media and playback flags' },
					{ name: 'nav', desc: 'false for a bare stage' }
				]
			}
		]
	},
	{
		slug: 'draw',
		title: 'Draw',
		hubSubtitle: 'Diagrams, sprites, playback',
		hubBody: `<p><b>Draw</b> is the vector and motion toolkit: shapes, paths, connectors inside a surface, sprites, a fake cursor, canvas drawing, and the shared animation playhead.</p>
		<p style="margin-top: 0.6em;">This reference covers the pieces and how they fit. Long motion studies live better as dedicated talks; keep this deck as the map.</p>
		<p style="margin-top: 1em;"><a href="./draw/title.html">Open the Draw reference →</a></p>`,
		deckTitle: 'References — Draw',
		deckDesc: 'GeekPresent Draw: shapes, Path, Sprite, Cursor, Canvas, AnimationBar, AnimationScene, SpriteStudio.',
				components: [
			{
				path: 'draw.html',
				title: 'Draw',
				subtitle: 'SVG surface for shapes and sprites',
				body: `<p><b>Draw</b> is the container for vector shapes and riding Sprites. Children register geometry; ADJUST can expose handles for editable shapes.</p>`,
				snippet: `<Draw>
  <Rect name="card" x={100} y={200} width={320} height={180} />
  <Line name="edge" from={[100, 200]} to={[420, 380]} />
</Draw>`,
				props: [
					{ name: '(children)', desc: 'shape and sprite components' }
				]
			},
			{
				path: 'shapes.html',
				title: 'Shapes',
				subtitle: 'Rect, Ellipse, Line, Curve, Arc, Polyline',
				body: `<p>Primitive shapes under Draw: boxes, ellipses, straight and curved strokes, arcs, polylines. Many support <code>draw</code> / <code>drawDelay</code> for stroke-reveal on the shared timeline.</p>`,
				snippet: `<Rect x={40} y={40} width={200} height={120} />
<Ellipse x={300} y={40} width={160} height={120} />
<Curve name="road" from={[0,0]} c1={[80,120]} c2={[160,120]} to={[240,0]} />`,
				props: [
					{ name: 'draw / drawDelay', desc: 'seconds to reveal; delay before start' },
					{ name: 'name', desc: 'for sprites to ride and ADJUST labels' }
				]
			},
			{
				path: 'path.html',
				title: 'Path',
				subtitle: 'Multi-segment stroke',
				body: `<p><b>Path</b> is a multi-segment stroke for richer outlines than a single Line/Curve — logos, freeform arrows, complex routes for sprites.</p>`,
				snippet: `<Path name="route" d="M 0 0 L 100 40 Q 160 80 220 40" draw={1.2} />`,
				props: [
					{ name: 'd / points', desc: 'path data depending on API shape' },
					{ name: 'draw', desc: 'reveal duration' }
				]
			},
			{
				path: 'sprite.html',
				title: 'Sprite',
				subtitle: 'HTML that flies a path',
				body: `<p><b>Sprite</b> moves slot content along a literal path or a named shape in the same Draw. Arc-length sampling keeps speed even; <code>orient</code> banks to the tangent.</p>`,
				snippet: `<Sprite path="road" size={[48, 48]} draw={2} delay={0.3}>
  <span>🚀</span>
</Sprite>`,
				props: [
					{ name: 'path', desc: 'shape name or path object' },
					{ name: 'delay / ease / orient', desc: 'timing and banking' }
				]
			},
			{
				path: 'cursor.html',
				title: 'Cursor',
				subtitle: 'Fake pointer for UI demos',
				body: `<p><b>Cursor</b> is a pointer glyph that glides or runs a script (<code>warpTo</code>, <code>moveTo</code>, <code>around</code>, <code>attention</code>). Gate with <code>startOn</code> and a Note trigger from the presenter console.</p>`,
				snippet: `<Cursor path={[[100,100],[400,300]]} size={48} />`,
				props: [
					{ name: 'path / script', desc: 'track or command list' },
					{ name: 'startOn', desc: 'named trigger pulse' }
				]
			},
			{
				path: 'canvas.html',
				title: 'Canvas',
				subtitle: 'Imperative pixels on the playhead',
				body: `<p><b>Canvas</b> is the escape hatch: draw with JS/TS against the same animation clock as Draw shapes when SVG is not enough.</p>`,
				snippet: `<Canvas width={800} height={450} draw={(ctx, t) => {
  /* t is playhead time */
}} />`,
				props: [
					{ name: 'draw', desc: 'frame callback' },
					{ name: 'width / height', desc: 'buffer size' }
				]
			},
			{
				path: 'animationbar.html',
				title: 'AnimationBar',
				subtitle: 'Shared transport for the slide',
				body: `<p><b>AnimationBar</b> is the scrubbable playhead. Draw strokes, sprites, and other timeline citizens stay in sync because their motion is CSS driven from the same clock.</p>`,
				snippet: `<AnimationBar />`,
				props: [
					{ name: 'duration', desc: 'optional total length override' }
				]
			},
			{
				path: 'animationscene.html',
				title: 'AnimationScene',
				subtitle: 'Scoped timeline region',
				body: `<p><b>AnimationScene</b> groups a bar + content so a slide can host more than one independent timeline (two demos, two bars).</p>`,
				snippet: `<AnimationScene>
  <AnimationBar />
  <Draw><!-- … --></Draw>
</AnimationScene>`,
				props: [{ name: '(children)', desc: 'bar + animated content' }]
			},
			{
				path: 'spritestudio.html',
				title: 'SpriteStudio',
				subtitle: 'Keyframe authoring wrapper',
				body: `<p><b>SpriteStudio</b> is the authoring shell for multi-stop sprite motion — define keyframes in one place instead of hand-writing every stop array.</p>`,
				snippet: `<SpriteStudio><!-- keyframe editor + preview --></SpriteStudio>`,
				props: [
					{ name: 'stops / path', desc: 'depending on studio mode' }
				]
			}
		]
	},
	{
		slug: 'data',
		title: 'Data',
		hubSubtitle: 'Tables and charts',
		hubBody: `<p><b>Data</b> is how you put numbers on the canvas: interactive tables and a family of charts that share scales, legends, and draw-in behaviour.</p>
		<p style="margin-top: 1em;"><a href="./data/title.html">Open the Data reference →</a></p>`,
		deckTitle: 'References — Data',
		deckDesc: 'GeekPresent data: DataTable and chart components.',
		components: [
			{
				path: 'datatable.html',
				title: 'DataTable',
				subtitle: 'Sortable, filterable table',
				body: `<p><b>DataTable</b> renders row data with optional search, pagination, and column toggles. Keep datasets in a colocated module; prefer static JSON-shaped data for GitHub Pages (no server).</p>`,
				snippet: `<DataTable {rows} {columns} />`,
				props: [
					{ name: 'rows / columns', desc: 'data and column defs' },
					{ name: 'pageSize', desc: 'pagination size when enabled' }
				],
				gotcha: 'There is no runtime server on GitHub Pages. “Server-side” table demos in the product tour need an external API or a different host — pure static rows always work.'
			},
			{
				path: 'barchart.html',
				title: 'BarChart',
				subtitle: 'Grouped and stacked bars',
				body: `<p><b>BarChart</b> plots categorical series as bars — grouped or stacked — with shared axis helpers from <code>$lib/chart</code>.</p>`,
				snippet: `<BarChart {series} xAxis={x} yAxis={y} width={900} height={480} />`,
				props: [
					{ name: 'series', desc: 'named numeric series' },
					{ name: 'xAxis / yAxis', desc: 'axis definitions' }
				]
			},
			{
				path: 'linechart.html',
				title: 'LineChart',
				subtitle: 'Lines, dual axis, time',
				body: `<p><b>LineChart</b> is the workhorse for trends. Supports multiple series and dual axes when units differ.</p>`,
				snippet: `<LineChart {series} xAxis={x} yAxis={y} />`,
				props: [{ name: 'series / axes', desc: 'same family as other cartesian charts' }]
			},
			{
				path: 'areachart.html',
				title: 'AreaChart',
				subtitle: 'Filled series, stackable',
				body: `<p><b>AreaChart</b> fills under lines — strong for composition over time. Can draw in with the animation timeline.</p>`,
				snippet: `<AreaChart {series} xAxis={x} yAxis={y} stacked />`,
				props: [{ name: 'stacked', desc: 'stack series when true' }]
			},
			{
				path: 'scatterchart.html',
				title: 'ScatterChart',
				subtitle: 'Points and bubbles',
				body: `<p><b>ScatterChart</b> maps x/y (and optional size) for correlations and clusters.</p>`,
				snippet: `<ScatterChart {series} xAxis={x} yAxis={y} />`,
				props: [{ name: 'series', desc: 'point series; size channel optional' }]
			},
			{
				path: 'combochart.html',
				title: 'ComboChart',
				subtitle: 'Bars + line together',
				body: `<p><b>ComboChart</b> overlays chart types (classically bars + line) when one series is magnitude and another is a rate.</p>`,
				snippet: `<ComboChart {series} xAxis={x} yAxis={y} />`,
				props: [{ name: 'series', desc: 'mixed-type series defs' }]
			},
			{
				path: 'piechart.html',
				title: 'PieChart',
				subtitle: 'Parts of a whole',
				body: `<p><b>PieChart</b> shows share-of-total. Prefer few slices; for many categories, a bar chart usually reads better.</p>`,
				snippet: `<PieChart {slices} width={420} height={420} />`,
				props: [
					{ name: 'slices', desc: 'label + value entries' }
				]
			},
			{
				path: 'waterfall.html',
				title: 'Waterfall',
				subtitle: 'Running totals',
				body: `<p><b>Waterfall</b> bridges a start value through signed steps to an end — budgets, funnels, reconciliation.</p>`,
				snippet: `<Waterfall {steps} xAxis={x} yAxis={y} />`,
				props: [{ name: 'steps', desc: 'ordered signed contributions' }]
			},
			{
				path: 'gantt.html',
				title: 'Gantt',
				subtitle: 'Spans and dependencies',
				body: `<p><b>Gantt</b> draws time spans per row with optional dependency edges — plans and release trains.</p>`,
				snippet: `<Gantt {tasks} width={1000} height={480} />`,
				props: [{ name: 'tasks', desc: 'rows with start/end (and deps)' }]
			},
			{
				path: 'histogram.html',
				title: 'Histogram',
				subtitle: 'Distribution of a numeric field',
				body: `<p><b>Histogram</b> bins a numeric sample into counts — latency, scores, sizes.</p>`,
				snippet: `<Histogram values={samples} bins={12} />`,
				props: [
					{ name: 'values / bins', desc: 'raw numbers and bin count' }
				]
			},
			{
				path: 'heatmap.html',
				title: 'Heatmap',
				subtitle: '2-D intensity grid',
				body: `<p><b>Heatmap</b> colours a matrix — day×hour traffic, confusion matrices, correlation grids.</p>`,
				snippet: `<Heatmap {matrix} xLabels={xs} yLabels={ys} />`,
				props: [
					{ name: 'matrix', desc: '2-D numeric values' },
					{ name: 'xLabels / yLabels', desc: 'axis categories' }
				]
			}
		]
	},
	{
		slug: 'features',
		title: 'Features',
		hubSubtitle: 'Deck-level tools',
		hubBody: `<p><b>Features</b> are mostly not dropped into a slide body — they are props on <code>SlideDeck</code>, chrome entries, or routes that serve the whole deck (handout, overview, kiosk).</p>
		<p style="margin-top: 1em;"><a href="./features/title.html">Open the Features reference →</a></p>`,
		deckTitle: 'References — Features',
		deckDesc: 'GeekPresent deck features: Annotate, Spotlight, Capture, Kiosk, Overview, Search, Handout, State, Progress.',
		extras: '\tannotate\n\tcapture\n\tkiosk\n',
		components: [
			{
				path: 'annotate.html',
				title: 'Annotate',
				subtitle: 'Speaker pen on the live slide',
				body: `<p><b>Annotate</b> is mounted by SlideDeck when the deck offers it (<code>annotate</code> prop). Ink is freehand (pen / highlighter), persists per slide, and never steals keyboard paging.</p>`,
				snippet: `<SlideDeck {pages} annotate />`,
				props: [
					{ name: 'annotate', desc: 'deck prop — offer the pen' },
					{ name: '?annotate', desc: 'sticky URL offer / =off to revoke' }
				]
			},
			{
				path: 'spotlight.html',
				title: 'Spotlight',
				subtitle: 'Dim around a named Block',
				body: `<p><b>Spotlight</b> is a canvas singleton: driven from speaker notes / triggers to ring a Block the author named. Toast can reuse the same punch-out.</p>`,
				snippet: `<!-- author names the target -->
<Block name="api">…</Block>
<!-- speaker console / Note trigger activates spotlight on that name -->`,
				props: [
					{ name: '(via notes / triggers)', desc: 'not usually imported on the slide' }
				]
			},
			{
				path: 'capture.html',
				title: 'Capture',
				subtitle: 'PNG of the true canvas',
				body: `<p><b>Capture</b> re-renders the 1920×1080 canvas to a PNG (ink in, chrome out). Offered via deck <code>capture</code> / sticky query / dev. Refuses rather than lying when an iframe cannot be read.</p>`,
				snippet: `<SlideDeck {pages} capture captureScale={2} />`,
				props: [
					{ name: 'capture / captureScale', desc: 'offer button; output multiplier' }
				]
			},
			{
				path: 'kiosk.html',
				title: 'Kiosk',
				subtitle: 'Unattended auto-advance',
				body: `<p><b>Kiosk</b> runs Space semantics on a timer: finish animations → steps → note lines → page → loop. Configure from ☰ or auto-start with <code>?kiosk</code>.</p>`,
				snippet: `<SlideDeck {pages} kiosk kioskStepMs={2000} kioskPageMs={6000} />`,
				props: [
					{ name: 'kioskStepMs / kioskPageMs', desc: 'dwell for builds vs page turns' }
				]
			},
			{
				path: 'overview.html',
				title: 'Overview',
				subtitle: 'All-slides grid (O)',
				body: `<p><b>Overview</b> (press <b>O</b>) shows a grid of live slide tiles. Click to jump. In dev, deck-structure editing (add/remove) can be armed from the grid.</p>`,
				snippet: `<!-- always available from SlideDeck chrome; no import -->`,
				props: [{ name: 'O key', desc: 'toggle overview' }]
			},
			{
				path: 'search.html',
				title: 'Full-deck search',
				subtitle: 'Find text across slides',
				body: `<p>Search lives with the Table of Contents: query the deck’s extracted text and jump to matches. Author ordinary readable copy so search has something to find.</p>`,
				snippet: `<!-- open ToC → search field; no per-slide import -->`,
				props: []
			},
			{
				path: 'handout.html',
				title: 'Handout',
				subtitle: 'Deck as one printable document',
				body: `<p>The handout stacks every slide at <code>/_handout/&lt;deck-id&gt;.html</code>. Optional <code>?notes</code>, <code>?grid</code>, <code>?grid&amp;notes</code>. Nested reference decks use ids like <code>references-shell</code>.</p>`,
				snippet: `<!-- e.g. /_handout/references-shell.html?notes -->`,
				props: [
					{ name: '?notes / ?grid', desc: 'layout variants' }
				]
			},
			{
				path: 'state.html',
				title: 'State',
				subtitle: 'URL, localStorage, stores',
				body: `<p>Remember values with <code>persisted()</code> from <code>$lib/stores/persisted</code>, read query params via <code>stateCore</code> helpers, and keep codecs total (junk → safe default). Guard <code>window</code> / storage with <code>browser</code>.</p>`,
				snippet: `import { persisted } from '$lib/stores/persisted';
import { numberCodec } from '$lib/utils/stateCore';
const zoom = persisted('my-zoom', 1, { codec: numberCodec({ min: 0.5, max: 3 }) });`,
				props: [
					{ name: 'sync', desc: 'cross-tab mirror; opt out when audience must not follow' }
				]
			},
			{
				path: 'progress.html',
				title: 'Progress API',
				subtitle: 'Which page of how many',
				body: `<p><code>getProgress()</code> exposes index, position, total, and fraction over <b>visible</b> slides (hidden appendices excluded). <code>ProgressBar</code> is the ready-made consumer.</p>`,
				snippet: `import { getProgress } from '$lib/presentation';
const progress = getProgress();
// $progress.position / $progress.total / $progress.fraction`,
				props: []
			}
		]
	}
];

// ─── Hub ───────────────────────────────────────────────────────────────────

const hubDir = join(routes, '(hub)');
write(
	join(hubDir, '+layout.svelte'),
	deckLayout({
		title: 'Component References',
		description:
			'Catalog of GeekPresent components by group — shell, layout, content, code, media, draw, data, and deck features.',
		articleHref: '../',
		articleText: '← Back to home'
	})
);
write(join(hubDir, '+layout.js'), LAYOUT_JS);
write(join(hubDir, '+page.svelte'), REDIRECT);

const hubPages = [
	{ path: 'title.html', title: 'Component References' },
	{ path: 'how-to.html', title: 'How to use this catalog' },
	...groups.map((g) => ({ path: `${g.slug}.html`, title: g.title })),
	{ path: 'thank-you.html', title: 'Next steps' }
];
write(join(hubDir, 'pages.ts'), pagesTs(hubPages));

slideFiles(
	hubDir,
	'title',
	titleSlide({
		title: 'Component References',
		subtitle: 'A catalog by group',
		blurb: 'Fresh reference decks — not the product-tour samples',
		nextHint: 'Next: how to use this catalog'
	})
);

slideFiles(
	hubDir,
	'how-to',
	refSlide({
		title: 'How to use this catalog',
		subtitle: 'Hub → group → component',
		body: `<p>Each slide in this hub introduces a <b>group</b>. Follow the link into that group’s own deck for one slide per component.</p>
		<ul style="margin: 0.7em 0 0 1.2em; line-height: 1.5;">
			<li><b>Hub</b> — map of the toolbox (<code>/references</code>)</li>
			<li><b>Group deck</b> — <code>/references/&lt;group&gt;/…</code></li>
			<li><b>Component slide</b> — problem, minimal snippet, props that matter, gotchas</li>
		</ul>
		<p style="margin-top: 0.8em;">These pages are written as <b>references</b> for authors and agents. They deliberately do not reuse the older in-deck “dev buddy” samples under <code>/slides</code>.</p>
		<p style="margin-top: 0.6em;">Import paths stay the same everywhere: <code>$lib/components/…</code>, <code>$lib/chart</code>, <code>$lib/draw</code>, <code>$lib/templates/…</code>.</p>`,
		snippet: null,
		props: []
	})
);

for (const g of groups) {
	slideFiles(
		hubDir,
		g.slug,
		refSlide({
			title: g.title,
			subtitle: g.hubSubtitle,
			body: g.hubBody,
			snippet: null,
			props: []
		})
	);
}

slideFiles(
	hubDir,
	'thank-you',
	titleSlide({
		title: 'Next steps',
		subtitle: 'Build a deck · skim a group · print a handout',
		blurb: 'Handouts: /_handout/references.html · /_handout/references-shell.html · …'
	})
);

// ─── Group decks ───────────────────────────────────────────────────────────

for (const g of groups) {
	const dir = join(routes, g.slug);
	const back = '../title.html';
	write(
		join(dir, '+layout.svelte'),
		deckLayout({
			title: g.deckTitle,
			description: g.deckDesc,
			articleHref: back,
			articleText: '← Component References',
			extras: g.extras || ''
		})
	);
	write(join(dir, '+layout.js'), LAYOUT_JS);
	// No deck-index +page.svelte: /references/<group> is not a leaf route. Linking
	// targets /references/<group>/title.html so prerender never needs an unseen index.

	const pageEntries = [
		{ path: 'title.html', title: g.title },
		...g.components.map((c) => ({
			path: c.path,
			title: c.title,
			adjust: c.adjust
		}))
	];
	write(join(dir, 'pages.ts'), pagesTs(pageEntries));

	slideFiles(
		dir,
		'title',
		titleSlide({
			title: g.title,
			subtitle: g.hubSubtitle,
			blurb: `${g.components.length} components in this group`,
			nextHint: `Group deck at /references/${g.slug}/`
		})
	);

	for (const c of g.components) {
		slideFiles(
			dir,
			c.path.replace(/\\.html$/, ''),
			refSlide({
				title: c.title,
				subtitle: c.subtitle,
				body: c.body,
				snippet: c.snippet,
				props: c.props,
				gotcha: c.gotcha
			})
		);
	}
}

console.log('\\nDone. Hub +', groups.length, 'group decks.');
