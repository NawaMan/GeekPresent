<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';

</script>

<ContentPage title="Note" subtitle="Speaker notes">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Note</b> holds speaker script. Visible under the canvas in SCALED (zoomed out) mode and in the presenter console / handout with notes. Marked <code>no-print</code> on the live slide chrome path as appropriate.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Note>
  <p>Remind them why static hosting rules out server routes.</p>
</Note>`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>data-trigger</code> — optional name for Cursor / spotlight cues from the console</li>
	</ul>

	<Callout kind="warn" title="Gotcha" style="margin-top: 0.8em;">
		The CSS class <code>.note</code> is reserved globally. Do not put <code>class="note"</code> on ordinary slide copy — use another name (e.g. <code>.cue</code>).
	</Callout>
	</div>
</ContentPage>
