<!--
  Your first slide. A slide is just a Svelte component rendered into the deck's
  canvas — reach for a template (TitlePage / ContentPage / AppendixPage) for the
  common shapes, or write plain markup for anything else.
-->
<script>
	import TitlePage from '$lib/templates/TitlePage.svelte';
</script>

<TitlePage>
	<span slot="title">My Deck</span>
	<span slot="subtitle">A talk about something</span>
	<span slot="subsubtitle">Your Name</span>
</TitlePage>
