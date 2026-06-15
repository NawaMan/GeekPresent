<!--
  Example: Speaker Notes
  File: src/routes/slides/speaker-notes.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Note from '$lib/components/Note.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
</script>

<ContentPage title="Speaker Notes" subtitle="Notes visible only in FIXED mode">
	<p>Switch to <b>FIXED</b> mode (top-right button) to see notes below the slide.</p>
	<QuickCode>
		&lt;Note&gt;<br/>
		&nbsp;&nbsp;&lt;p&gt;Remember to explain X.&lt;/p&gt;<br/>
		&nbsp;&nbsp;&lt;p&gt;Mention Y as a follow-up.&lt;/p&gt;<br/>
		&lt;/Note&gt;
	</QuickCode>
	<p>Notes are hidden in <b>SCALED</b> mode and when printing.</p>
</ContentPage>

<Note>
	<p>This is a speaker note! It appears below the slide in FIXED mode.</p>
	<p>Use notes to remind yourself of talking points during your presentation.</p>
	<p>Notes are not visible to the audience when presenting in SCALED mode.</p>
</Note>
