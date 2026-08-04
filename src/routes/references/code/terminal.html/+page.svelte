<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Terminal" subtitle="Scripted fake console">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Terminal</b> types commands and prints output on a pure CSS timeline — seekable, with a transport. Space can step commands then page the deck when <code>keys="global"</code>.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Terminal
  commands={[
    { in: 'pnpm build', out: '✓ built in 3.1s' }
  ]}
/>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>commands</code> — list of input / output steps</li>
			<li><code>keys / controls</code> — keyboard integration; hide built-in transport if AnimationBar owns time</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		Do not put both a free-running Terminal transport and an AnimationBar on the same clock without coordinating — pass <code>controls={false}</code> if the bar owns playback.
	</Callout>
	</div>
</ContentPage>
