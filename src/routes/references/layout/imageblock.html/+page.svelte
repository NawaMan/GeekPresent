<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ImageBlock" subtitle="Absolute image with resize behaviour">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ImageBlock</b> is a Block specialised for a picture: the image fills the panel; aspect is locked by default (Alt to break while resizing in ADJUST).</p>
		<p style="margin-top: 0.5em;">Always <code>import</code> the asset so the build hashes it and respects base paths.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<script>
  import ImageBlock from '\$lib/components/ImageBlock.svelte';
  import photo from './photo.png';
</script>
<ImageBlock src={photo} alt="Demo" x={760} y={400} width={400} height={300} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>src / alt</code> — image source (imported) and accessible text</li>
			<li><code>x y width height</code> — canvas box</li>
			<li><code>aspect</code> — true | number | false</li>
	</ul>

	</div>
</ContentPage>
