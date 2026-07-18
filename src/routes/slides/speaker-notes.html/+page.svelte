<!--
  Example: Speaker Notes
  File: src/routes/slides/speaker-notes.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Note from '$lib/components/Note.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Kbd from '$lib/components/Kbd.svelte';
</script>

<ContentPage title="Speaker Notes" subtitle="Notes visible below the slide in SCALED mode">
	<p>Switch to <b>SCALED</b> mode (top-right) and zoom out below the fit to see notes below the slide.</p>
	<QuickCode lang="svelte" code={`<Note>
  <p>Remember to explain X.</p>
  <p>Mention Y as a follow-up.</p>
</Note>`} />
	<p>Notes are hidden in <b>FITTED</b> mode and when printing.</p>
	<p>
		Open the <b>presenter console</b> (the <b>PRESENT</b> chrome button) for your notes in
		their own pane, with the next slide previewed. There the keyboard drives the console:
		<Kbd keys="T" /> opens the table of contents, <Kbd keys="C" /> the reset-checks menu, and
		<Kbd keys="A" /> the reset-annotations menu — <Kbd keys="Esc" /> closes any of them. Each
		key is the underlined letter in its button, so there is no legend to memorise.
	</p>
	<p>
		While the console is open it becomes the <b>single</b> notes surface: this
		below-the-slide copy disappears — redundant, and it was only eating height under an
		already-shrunken slide. Close the console and it returns as the no-console fallback.
	</p>
</ContentPage>

<Note>
	<p>This is a speaker note! It appears below the slide in SCALED mode (zoomed out).</p>
	<p>Use notes to remind yourself of talking points during your presentation.</p>
	<p>Notes are not visible to the audience when presenting in FITTED mode.</p>
</Note>
