<!--
  Example: Video component
  File: src/routes/slides/video-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Video       from '$lib/components/Video.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';
	// Imported as an asset, not written as "/media/demo.mp4": Vite resolves it to a
	// hashed URL that survives a GitHub Pages base path.
	import demo        from './demo.mp4';

	const path = 'src/routes/slides/video-component.html/+page.svelte';

	// Deliberately out of order, and mixing seconds with clock strings — the
	// component parses and sorts them.
	const bookmarks = [
		{ at: '0:12', tag: 'SEEK',  label: 'Click anywhere on the track to scrub.' },
		{ at: 0,      tag: 'PLAY',  label: 'A video, on a slide — our chrome, not the browser’s.' },
		{ at: '0:18', tag: 'SHIP',  label: 'Ships with GeekPresent.' },
		{ at: 6,      tag: 'MARKS', label: 'Chapters seek; the current one lights up.' },
	];
</script>

<ContentPage title="Video" subtitle="A player with time bookmarks">
	<div style="max-width: 850px;">
		<p>
			<b>Video</b> is a <code>&lt;video&gt;</code> with chrome you can theme and a
			chapter list that <b>seeks</b>. Wrap it in a <code>Block</code> and it fills the box.
		</p>

		<QuickCode style="margin-top: 0.6em; font-size: 0.8em">
			&lt;Video src={'{'}demo{'}'} bookmarks={'{'}[<br/>
			&nbsp;&nbsp;{'{'} at: "0:03", tag: "HOST", label: "No toolchain." {'}'},<br/>
			&nbsp;&nbsp;{'{'} at: "1:14", tag: "BOOTH", label: "It builds." {'}'},<br/>
			]{'}'} /&gt;
		</QuickCode>

		<p style="margin-top: 0.7em;">
			<code>at</code> takes seconds or a clock string, in any order — they are parsed
			and sorted. The chapter the playhead has passed lights up, in the list and as a
			tick on the track.
		</p>

		<Callout kind="tip" title="The keyboard still pages the deck" style="margin-top: 0.8em; font-size: 0.8em">
			→/← always move between slides, so the track is a <b>pointer</b> affordance and
			skips Tab entirely. The chapter buttons are the keyboard’s seek — they say where
			they go, which a scrub bar never can. Opt in with <code>keys="global"</code> and
			<b>Space</b> seeks chapter to chapter, then pages on (see <b>VideoPage</b>).
		</Callout>
	</div>
</ContentPage>

<!-- Everything the component needs is here: a source and four bookmarks. -->
<Block name="player" x={940} y={250} width={900} height={660} grid={10}>
	<Video src={demo} {bookmarks} loop />
</Block>

<Hint text="Play it, then click a chapter — the tick and the row light up together" />

<ViewSource {source} {path} />
