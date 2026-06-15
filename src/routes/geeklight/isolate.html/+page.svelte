<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CodeBox     from '$lib/components/CodeBox.svelte';

	let show = false;

	const code = `# Give each project its own isolated interpreter
python -m venv .venv

# Activate it (macOS / Linux)
source .venv/bin/activate

# Install exactly what THIS project needs, nowhere else
pip install -r requirements.txt

# Freeze the result so the next person gets the same world
pip freeze > requirements.txt`;
</script>

<ContentPage title="Isolate with a virtual environment" subtitle="One project, one interpreter, one pinned set of deps">
	<div style="font-size: 0.85em;">
		<p>
			A virtual environment is a private Python just for this project. Installs land in
			<code>.venv/</code>, not in the system — so Project A and Project B stop fighting, and
			the setup becomes something you can <i>commit</i> instead of remember.
		</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => show = true}>
			Show the commands
		</button>
		<p style="margin-top: 0.6em; opacity: 0.7; font-size: 0.85em;">
			Click CLOSE, click outside, or press Escape to dismiss. (Monaco loads from a CDN &mdash; needs internet.)
		</p>
	</div>
</ContentPage>

<CodeBox code={code} language="shell" title="setup.sh" bind:expanded={show} revealedLines={[1]} />
