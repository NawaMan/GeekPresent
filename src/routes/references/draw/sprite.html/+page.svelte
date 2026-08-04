<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Sprite" subtitle="HTML that flies a path">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Sprite</b> moves slot content along a literal path or a named shape in the same Draw. Arc-length sampling keeps speed even; <code>orient</code> banks to the tangent.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Sprite path="road" size={[48, 48]} draw={2} delay={0.3}>
  <span>🚀</span>
</Sprite>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>path</code> — shape name or path object</li>
			<li><code>delay / ease / orient</code> — timing and banking</li>
	</ul>

	</div>
</ContentPage>
