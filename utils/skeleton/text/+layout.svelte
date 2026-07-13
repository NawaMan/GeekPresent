<!--
  Your Text artifact — the second kind of thing GeekPresent builds.

  A presentation is many discrete slides, each a fixed 1920x1080 canvas. A Text is ONE
  long page: a fluid column that follows the window, growing as you add content. Same
  components, same build, different shape — you author it by hand and it scrolls.

  All the machinery (scroll container, column, typography, nav) lives in <TextPage>; this
  layout only names the page. The title and description below are the SEO surface, so say
  something real. To add a second Text, copy this whole folder and add its route to
  TEXT_ROUTES in src/lib/seo/routes.ts, or it will not reach the sitemap.
-->
<script lang="ts">
	import TextPage from '$lib/components/TextPage.svelte';
</script>

<TextPage
	title="My Text — a page that scrolls"
	description="A long-form page built with GeekPresent."
	type="article"
>
	<slot />
</TextPage>
