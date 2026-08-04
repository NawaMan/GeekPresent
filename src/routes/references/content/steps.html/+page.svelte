<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Steps & Fragment" subtitle="Build reveals on one slide">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Steps</b> drives progressive disclosure. <b>Fragment</b> (or step-gated children) appears as the speaker advances — Space semantics integrate with kiosk and the animation bar where relevant.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Steps>
  <Fragment>First point</Fragment>
  <Fragment>Second point</Fragment>
</Steps>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>active / keys</code> — control which step is shown and keyboard bindings</li>
	</ul>

	</div>
</ContentPage>
