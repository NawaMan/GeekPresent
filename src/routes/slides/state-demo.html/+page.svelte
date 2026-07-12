<!--
  Example: how a deck carries STATE — the URL, localStorage, and a store.
  File: src/routes/slides/state-demo.html/+page.svelte

  This slide IS its own demo. The counter below really is persisted (press +, then
  reload the page — the number is still there), and the greeting really is read out
  of this page's own query string. Nothing here is a screenshot or a mock-up: the
  mechanisms being described are the mechanisms running the slide.

  It is also the slide that states the SSR boundary out loud, because that is the
  part authors get wrong, and getting it wrong FAILS THE BUILD rather than
  degrading at runtime: `localStorage` does not exist during prerender.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Block from '$lib/components/Block.svelte';
	import Label from '$lib/components/Label.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';

	import { persisted, reset } from '$lib/stores/persisted';
	import { numberCodec, readTextParam } from '$lib/utils/stateCore';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/state-demo.html/+page.svelte';

	// 1. localStorage, via a store. Created at module scope — which is safe precisely
	//    because `persisted` degrades to a plain writable on the server. Bounded, so a
	//    hand-edited key can never render a three-mile-wide number.
	const COUNT_KEY = 'geekpresent:demo:count';
	const COUNT_INITIAL = 0;
	const NAME_INITIAL = 'world';
	const count = persisted<number>(COUNT_KEY, COUNT_INITIAL, {
		codec: numberCodec({ min: 0, max: 99 })
	});

	// What the BUILD actually wrote into state-demo.html. They are the initial values by
	// definition: the file is produced once, on a machine with no browser and no visitor, so
	// the defaults are the only thing it CAN contain. The SSR box prints them beside the live
	// values, and after a reload the two disagree — which is the boundary, made visible.
	const BUILT_COUNT = COUNT_INITIAL;
	const BUILT_NAME = NAME_INITIAL;

	// 2. The URL. `browser &&` is the whole guard: during prerender there is no request
	//    URL to speak of, so this is `''` and the slide renders its default greeting.
	//    On hydration the expression re-runs, the param arrives, and the greeting
	//    changes — one tick after paint. `readTextParam` is what makes a hostile
	//    `?name=` (4 MB of newlines) a non-event.
	$: name = browser ? readTextParam($page.url.searchParams, 'name', '') : '';
	$: greeting = name || NAME_INITIAL;
</script>

<ContentPage title="State" subtitle="The URL, localStorage, and the deck's own stores">
	<!-- 0.8em: the three demo boxes below are the subject of this slide, so the prose gives
	     way to them rather than the other way round. At full size the column ran to y≈710 and
	     collided with the boxes. -->
	<div style="line-height: 1.5em; font-size: 0.8em;">
		<p>
			A deck remembers things in three places, and they are <i>not</i> interchangeable.
			The <b>URL</b> is shareable — it is the only one you can read aloud to an audience.
			<b>localStorage</b> is private to one browser and survives a reload.
			A <b>store</b> is neither: it is fast, and it forgets the moment the page does.
		</p>
		<p style="margin-top: 0.5em;">
			Both of the first two are <b>strings from outside</b>, so every read is a parse that
			can fail — a key another tab corrupted, a param someone hand-typed. That is why they
			are read through <Label>stateCore</Label>, which is pure and total: junk in, a usable
			value out, never <code>NaN</code>.
		</p>
		<QuickCode
			style="margin-top: 0.6em;"
			lang="svelte"
			code={`const count = persisted('geekpresent:demo:count', 0, { codec: numberCodec({ min: 0, max: 99 }) });

$: name = browser && readTextParam($page.url.searchParams, 'name', '');`}
		/>
	</div>
</ContentPage>

<!-- localStorage: the number really does survive a reload. -->
<Block name="counter" x={130} y={650} width={520} height={290}>
	<div class="demo store">
		<h3>localStorage</h3>
		<div class="count" data-testid="count">{$count}</div>
		<div class="row">
			<button on:click={() => count.update((n) => Math.min(99, n + 1))}>+</button>
			<button on:click={() => count.update((n) => Math.max(0, n - 1))}>−</button>
			<button class="quiet" on:click={() => reset(count, 0)}>Reset</button>
		</div>
		<p class="cue">Press <b>+</b>, then <b>reload</b>. It stays.</p>
	</div>
</Block>

<!-- The URL: the greeting is read from this page's own query string. -->
<Block name="param" x={700} y={650} width={520} height={290}>
	<div class="demo url">
		<h3>Query parameter</h3>
		<div class="hello">Hello, <span class="who" data-testid="greeting">{greeting}</span>!</div>
		<div class="row">
			<a href="?name=Ada">?name=Ada</a>
			<a href="?name=Grace">?name=Grace</a>
			<a class="quiet" href="./state-demo.html">clear</a>
		</div>
		<p class="cue">Shareable — it even survives a <i>different</i> browser.</p>
	</div>
</Block>

<!-- The boundary — and it SHOWS it rather than asserting it. The left column is what the
     build actually put in the .html file (the defaults, literally: this deck is built once,
     before any visitor exists, so it cannot contain anyone's count). The right column is
     what is on screen now. Press + and reload and the two columns visibly disagree, which
     IS the boundary. A box that only recited the rule taught nobody anything. -->
<Block name="ssr" x={1270} y={650} width={520} height={290}>
	<div class="demo ssr">
		<h3>The SSR boundary</h3>
		<p class="lede">
			This deck is built into files <b>once</b>, before anyone visits — so the file cannot
			know <i>your</i> count.
		</p>
		<div class="cmp">
			<div class="cmp-row">
				<span class="cmp-k">In the built file</span>
				<span class="cmp-v dim">{BUILT_COUNT} · {BUILT_NAME}</span>
			</div>
			<div class="cmp-row">
				<span class="cmp-k">On your screen</span>
				<span class="cmp-v live" data-testid="live">{$count} · {greeting}</span>
			</div>
		</div>
		<p class="cue">Press <b>+</b>, reload — now these two disagree.</p>
	</div>
</Block>

<Hint text="Press + a few times, then reload — the count survives. Then click ?name=Ada." />

<ViewSource {source} {path} />

<style>
	.demo {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		padding: 0.75em 1em;
		/* The boxes carry the slide, so they stay bigger than the prose — but they have to
		   live inside 290px, and at 1.15em the contents overflowed the box outright. */
		font-size: 0.95em;
		line-height: 1.4;
	}
	.demo h3 {
		margin: 0 0 0.25em;
		font-size: 0.95em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		opacity: 0.85;
	}
	/* One box per mechanism, and each keeps its colour for the whole slide, so the
	   audience can match the prose to the box without being told which is which. */
	.demo.store {
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
	.demo.url {
		background: #1f4d33;
		border: 2px solid #00b356;
		color: #d8ffe9;
	}
	.demo.ssr {
		background: #2a2118;
		border: 2px solid #d98a2b;
		color: #f3e3cf;
		text-align: left;
		align-items: stretch;
	}
	.count {
		font-size: 2.6em;
		font-weight: bold;
		line-height: 1.05;
		font-variant-numeric: tabular-nums;
	}
	.hello {
		font-size: 1.35em;
		margin: 0.35em 0 0.1em;
	}
	.who {
		font-weight: bold;
		/* A long ?name= is capped at 64 chars by stateCore, but 64 chars is still wider
		   than the box — so the box, not the parser, has the last word on layout. */
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		vertical-align: bottom;
	}
	.row {
		display: flex;
		gap: 0.5em;
		margin-top: 0.55em;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}
	.row button,
	.row a {
		font: inherit;
		font-size: 0.85em;
		padding: 0.25em 0.85em;
		border-radius: 999px;
		border: 1px solid currentColor;
		background: rgba(255, 255, 255, 0.08);
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	.row button:hover,
	.row a:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	/* The secondary action (Reset / clear). It reads as secondary through its DASHED border
	   and flat background — never by dimming the label, which was the bug: `opacity: 0.7` on
	   pale blue over a translucent-white pill left the text barely legible against the box. */
	.row .quiet {
		background: transparent;
		border-style: dashed;
		font-weight: 600;
	}
	.row .quiet:hover {
		background: rgba(255, 255, 255, 0.18);
	}
	.cue {
		margin-top: 0.5em;
		font-size: 0.8em;
		opacity: 0.85;
	}
	.demo.ssr .lede {
		margin: 0 0 0.6em;
		font-size: 0.85em;
	}
	/* The two readings, stacked so the eye compares them vertically. The top one is what the
	   BUILD produced and is frozen; the bottom one is live. After a reload they differ. */
	.cmp {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		padding: 0.5em 0;
		border-top: 1px solid rgba(243, 227, 207, 0.25);
		border-bottom: 1px solid rgba(243, 227, 207, 0.25);
	}
	.cmp-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.6em;
	}
	.cmp-k {
		font-size: 0.75em;
		opacity: 0.8;
		white-space: nowrap;
	}
	.cmp-v {
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	/* Frozen: struck through in spirit — it is what the file says, not what is true now. */
	.cmp-v.dim {
		opacity: 0.55;
		font-weight: normal;
	}
	.cmp-v.live {
		color: #ffd9a0;
	}
	code {
		font-family: ui-monospace, monospace;
		font-size: 0.92em;
		padding: 0 0.2em;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.12);
	}
</style>
