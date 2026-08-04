<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="ADJUST mode" subtitle="Authoring aid for pixel placement">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>ADJUST</b> is not a component you import — it is a mode on the deck. In dev it is always offered; in a build, opt in with <code>adjust: true</code> on a <code>pages.ts</code> entry or sticky <code>?adjust</code>.</p>
		<p style="margin-top: 0.5em;">Drag Blocks, Copy the tag, or SAVE in <code>pnpm dev</code>. On a static host SAVE refuses with NOT ALLOWED — Copy still works.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`// pages.ts — offer ADJUST on a teaching slide
{ path: "diagram.html", title: "Diagram", adjust: true }`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>precedence</code> — dev &gt; ?adjust / ?adjust=off &gt; pages.ts adjust &gt; off</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		SAVE only rewrites tags it can place confidently. Expression geometry and twin samples can yield partial writes — the button reports tallies like <code>1 OF 2</code>.
	</Callout>
	</div>
</ContentPage>
