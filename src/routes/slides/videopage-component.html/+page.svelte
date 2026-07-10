<!--
  Example: VideoPage component
  File: src/routes/slides/videopage-component.html/+page.svelte

  The whole slide is one component. Nothing else is on this page — no ContentPage,
  no NavigationBar: VideoPage renders its own, exactly as TitlePage does.

  `keys="global"` turns the bookmarks into a build: SPACE seeks to the next chapter,
  and once the last one is behind the playhead it pages to the next slide.
-->
<script>
	import VideoPage from '$lib/components/VideoPage.svelte';
	import demo      from '../video-component.html/demo.mp4';

	const bookmarks = [
		{ at: 0,      tag: 'PLAY',  label: 'The video is the slide.' },
		{ at: 6,      tag: 'SPACE', label: 'Space seeks to the next chapter…' },
		{ at: '0:12', tag: 'SPACE', label: '…and keeps going, chapter by chapter.' },
		{ at: '0:18', tag: 'PAGE',  label: 'Past the last one, Space pages the deck.' },
	];
</script>

<!-- No Hint here: it would park on top of the chapter list, which already says this. -->
<VideoPage src={demo} {bookmarks} keys="global" loop />
