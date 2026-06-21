<!--
  SEO example — a Text artifact that explains GeekPresent's SEO/social metadata
  AND demonstrates it: this layout sets a custom per-page title + description, so
  the page below can show off its OWN emitted <head> tags (read live in
  +page.svelte). This is exactly how any Text sets its SEO — via <TextPage>.
-->
<script lang="ts">
	import TextPage from '$lib/components/TextPage.svelte';
</script>

<TextPage
	title="SEO & Social Cards — GeekPresent"
	description="How GeekPresent gives every prerendered page real SEO and social-share metadata — and how to set the base URL, per-deck defaults, and per-slide overrides."
	type="article"
>
	<slot />
</TextPage>
