<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Kbd" subtitle="Keyboard glyph">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Kbd</b> renders a key or chord in a platform-aware way (Mod becomes ⌘ / Ctrl as appropriate).</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`Undo with <Kbd keys="Mod+Z" />.`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>keys</code> — chord string, e.g. Mod+Shift+R</li>
			<li><code>(slot)</code> — or nest text for a custom cap</li>
	</ul>

	</div>
</ContentPage>
