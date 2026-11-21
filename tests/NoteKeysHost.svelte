<!-- Fixture for the note lines' keyboard cursor: a <Note> with a highlight line, a plain
     line, a trigger line and a line that is both. -->
<script>
	import Note from '$lib/components/Note.svelte';
</script>

<Note>
	<li data-highlight="db">The query hits the database</li>
	<li>A plain line</li>
	<li data-trigger="save-cursor">Now I click Save</li>
	<li data-highlight="cache" data-trigger="warm">The cache warms</li>
</Note>
