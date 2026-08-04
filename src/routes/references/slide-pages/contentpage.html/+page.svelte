<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
</script>

<ContentPage title="ContentPage" subtitle="Standard body slide — and this page is one">
	<div style="width: 100%; line-height: 1.5;">
		<p>
			<b>ContentPage</b> is the default workhorse: a title, optional subtitle, a rule,
			and a default slot for the body. The body fills the remaining canvas under the header.
		</p>

		<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<ContentPage title="Topic" subtitle="Optional cue">
  <p>Body content goes here.</p>
</ContentPage>`} />

		<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
		<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>title / subtitle</code> — header strings; empty string drops that line</li>
			<li><code>rule</code> — false removes the hairline under the header</li>
			<li><code>align</code> — <code>left</code> (default) or <code>center</code> for the header</li>
		</ul>
		<Callout kind="tip" title="You are looking at a ContentPage" style="margin-bottom: 0.8em;">
			The orange title, subtitle, hairline rule, and this body column <b>are</b> the
			template. Most slides in this catalog use the same shell.
		</Callout>
	</div>
</ContentPage>
