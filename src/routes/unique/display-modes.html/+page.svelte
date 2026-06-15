<!--
  Unique #2b: Two display modes — SCALED and FIXED
  File: src/routes/unique/display-modes.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Note        from '$lib/components/Note.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="Two ways to show it" subtitle="The same fixed canvas, presented two ways">
	<p>
		That fixed canvas can be displayed in two modes &mdash; toggle them with the
		button in the <b>top-right</b> corner:
	</p>
	<ul style="margin-top: 0.4em;">
		<li>
			<b>SCALED</b> &mdash; the slide scales to fit the window. This is how you
			<b>present</b> (you're looking at it now).
		</li>
		<li>
			<b>FIXED</b> &mdash; the slide stays exactly 1920&times;1080, and your
			<b>speaker notes</b> become visible below it.
		</li>
	</ul>
	<p style="margin-top: 0.6em; opacity: 0.8;">
		Switch to FIXED and the note below this slide appears &mdash; only you see it while presenting.
	</p>
</ContentPage>

<Note><p>This is a speaker note. It's hidden in SCALED mode and when printing, and shows only in FIXED mode &mdash; proof that the two modes do different jobs.</p></Note>

<Hint text="Toggle SCALED / FIXED (top-right) — in FIXED, the speaker note below appears" />
