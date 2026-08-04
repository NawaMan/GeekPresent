<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="QuickCode" subtitle="Small highlighted snippet">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>QuickCode</b> is the default for short samples on a slide. Shiki highlighting, no CDN editor, safe under client-side navigation.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<QuickCode lang="svelte" code={\`<Note>
  <p>Say this aloud.</p>
</Note>\`} />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>code / lang</code> — source string and Shiki language id</li>
	</ul>

	</div>
</ContentPage>
