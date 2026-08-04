<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Carousel & CarouselItem" subtitle="Paged horizontal showcase">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Carousel</b> steps through <b>CarouselItem</b> panels — screenshots, quotes, or mini case studies — without changing the deck page.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Carousel>
  <CarouselItem>First panel</CarouselItem>
  <CarouselItem>Second panel</CarouselItem>
</Carousel>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>(items)</code> — one CarouselItem per panel</li>
	</ul>

	</div>
</ContentPage>
