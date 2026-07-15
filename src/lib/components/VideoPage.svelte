<!--
  VideoPage — a video filling the whole slide canvas. (The TODO calls this VDOPage;
  it is named for the `Video` it wraps, as WebPage is for WebSite.)

  The full-bleed sibling of Video: same player, same chrome, same bookmarks — but
  stretched over the deck's fixed 1920x1080 canvas instead of a Block. Use Video
  when the recording is ONE element on a slide; use VideoPage when it IS the slide.

  Usage — this is a complete slide:

    <script>
      import VideoPage from '$lib/components/VideoPage.svelte';
      import demo      from './demo.mp4';
    </script>

    <VideoPage src={demo} keys="global" bookmarks={[
      { at: '0:03', tag: 'HOST',  label: 'No toolchain on the host.' },
      { at: '1:14', tag: 'BOOTH', label: 'It builds.' },
    ]} />

  It renders its own NavigationBar (like TitlePage / ContentPage / WebPage do), so
  paging still works with the video on screen. Composing it INSIDE a page template
  would give you two nav bars — pass `nav={false}` there.

  `keys="global"` is worth more here than on a mixed slide: when the video IS the
  content, Space walking chapter to chapter and then paging on is exactly the deck's
  forward march. It stays opt-in all the same — see Video.svelte for why.

  Layering: the player is absolutely positioned and carries no z-index, so it paints
  in DOM order — the deck's own chrome (ADJUST toggle, Table of Contents, speaker
  Notes) and this component's nav bar are later siblings and stay above it. A
  <video> takes no keys of its own, so nothing here competes for the deck's.

  Props: `src`, `poster`, `bookmarks`, `chapters`, `controls`, `native`, `keys`,
  `continueKey`, `start`, `autoplay`, `loop`, `muted`, `playsinline`, `preload` all
  pass straight through to Video. Plus:
    nav    — render the NavigationBar (default true). False when nesting in a template.
    height — text mode only: the player's height there (a text artifact has no canvas).

  In `text` mode there is no canvas to fill, so the player drops out of the absolute
  layer into normal flow at `height`, with no nav bar.
-->
<script lang="ts">
	import { getPageNavigation, type PageNavigation } from '$lib/utils/navigate';
	import { getMode, getPages } from '$lib/presentation';
	import { page } from '$app/stores';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import Video from '$lib/components/Video.svelte';
	import type { Bookmark } from '$lib/utils/videoCore';

	/** The video URL. Import the file as an asset so it survives a base path. */
	export let src: string = '';
	/** Still frame shown before playback. */
	export let poster: string = '';
	/** Chapter markers: `{ at: '1:14', label: '…', tag: 'BOOTH' }`. */
	export let bookmarks: Bookmark[] = [];
	/** Render the chapter list under the bar. */
	export let chapters: boolean = true;
	/** Render Video's chrome bar. */
	export let controls: boolean = true;
	/** Use the browser's own controls instead. */
	export let native: boolean = false;
	/** 'global': Space/Shift+Space step the bookmarks, then page the deck. */
	export let keys: 'global' | 'off' = 'off';
	/** Also seek on the presenter console's CONTINUE pulse. Needs `keys`. */
	export let continueKey: boolean = true;
	/** Seek here once metadata arrives — seconds or a clock string. */
	export let start: number | string | null = null;
	/** Start playing on mount (browsers require `muted`). */
	export let autoplay: boolean = false;
	/** Restart on end. */
	export let loop: boolean = false;
	/** Start muted. `undefined` → muted iff `autoplay`. */
	export let muted: boolean | undefined = undefined;
	/** Play inline on iOS. */
	export let playsinline: boolean = true;
	/** How much to fetch up front. */
	export let preload: 'none' | 'metadata' | 'auto' = 'metadata';
	/** Render the NavigationBar. False when nesting inside a page template. */
	export let nav: boolean = true;
	/** Text mode only: how tall the player renders where there is no canvas. */
	export let height: string = '640px';
	/** Inline style for the root element, applied last so it wins. */
	export let style: string = '';
	/** DOM id for the root element. */
	export let id: string = '';
	/** Extra class(es) for the root element. NOTE: a slide's own style block is scoped, so a
	    class defined there will NOT match — use global CSS (global.css / roles.css / a
	    :global(...) block) or a utility class. See AGENTS.md. */
	let klass: string = '';
	export { klass as class };

	const isText = getMode() === 'text';
	const pages = getPages();

	let navigation: PageNavigation;
	$: navigation = getPageNavigation(pages, $page.url.pathname.split('/').pop() || '', './');
</script>

<div class="videopage {klass}" class:text-mode={isText} id={id || undefined} style={style || undefined}>
	<Video
		{src}
		{poster}
		{bookmarks}
		{chapters}
		{controls}
		{native}
		{keys}
		{continueKey}
		{start}
		{autoplay}
		{loop}
		{muted}
		{playsinline}
		{preload}
		height={isText ? height : '100%'}
	/>
</div>

{#if nav && !isText}
	<NavigationBar
		firstLink={navigation.first}
		prevLink={navigation.prev}
		nextLink={navigation.next}
		lastLink={navigation.last}
	/>
{/if}

<style>
	/* Absolute against the deck's .container (the only positioned ancestor), so this
	   covers the full canvas — the same coordinate space Block authors in. No
	   z-index: later siblings (nav bar, TOC, Notes) must keep painting above it. */
	.videopage {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	/* No canvas in a text artifact — fall back into the document flow. */
	.videopage.text-mode {
		position: static;
		inset: auto;
		width: 100%;
	}
</style>
