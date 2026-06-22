<!--
  Unique #2b: Two display modes — FITTED and SCALED
  File: src/routes/unique/display-modes.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Note        from '$lib/components/Note.svelte';
	import Hint        from '$lib/components/Hint.svelte';
</script>

<ContentPage title="Two ways to show it" subtitle="The same fixed canvas, two display modes">
	<p>
		That fixed canvas can be displayed in two modes &mdash; pick them from the
		control in the <b>top-right</b> corner:
	</p>
	<ul style="margin-top: 0.4em;">
		<li>
			<b>FITTED</b> &mdash; the slide scales to fit the window. This is how you
			<b>present</b> (you're looking at it now).
		</li>
		<li>
			<b>SCALED</b> &mdash; the slide is shown at an <b>exact factor</b> (1:1 and
			beyond), centered and <b>pannable</b>, with a minimap when it overflows the
			window. Pick a % or a target resolution from the menu &mdash; handy for
			pixel-checking a layout.
		</li>
	</ul>
	<p style="margin-top: 0.6em; opacity: 0.8;">
		Zoom SCALED out below the fit and your <b>speaker notes</b> appear below the slide &mdash; only you see them while presenting.
	</p>
</ContentPage>

<Note><p>This is a speaker note. It shows below the slide in SCALED mode when the slide is smaller than the window, and is hidden when printing &mdash; proof that the two modes do different jobs.</p></Note>

<Hint text="Top-right: switch FITTED / SCALED and pick a zoom — in SCALED, zoom out to reveal this note" />
