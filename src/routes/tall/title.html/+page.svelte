<!--
  Portrait title slide. Same TitlePage template as the landscape deck — it just
  flows into the tall 1080x1920 frame set by tall/+layout.svelte.
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">GeekPortrait</span>
	<span slot="subtitle">Portrait, in 60 seconds</span>
	<span slot="subsubtitle">A vertical deck for YouTube Shorts<br/>
		<a href="../" style="font-size: 0.55em; opacity: 0.85; color: inherit;">↑ back to the home page</a></span>
</TitlePage>
