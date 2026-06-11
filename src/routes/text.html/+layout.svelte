<!--
  Text artifact route.

  A Text is the second kind of GeekPresent artifact: ONE long page, whose height
  grows with the content that flows down it. It is authored by hand (in
  +page.svelte) and reuses the same $lib components as the slides — it is NOT
  generated from a presentation.

  The shell (scroll container, flowing column, base typography, nav bar) lives in
  $lib/components/TextPage.svelte. To make another Text, copy this folder and
  author its +page.svelte.
-->
<script lang="ts">
	import TextPage from '$lib/components/TextPage.svelte';
</script>

<TextPage>
	<slot />
</TextPage>
