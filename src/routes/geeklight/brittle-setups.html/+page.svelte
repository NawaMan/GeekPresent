<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
</script>

<ContentPage title="Brittle, fragile setups" subtitle="One wrong install and the whole thing tips over">
	<div style="font-size: 0.85em;">
		<p>
			A Python project that runs today is no guarantee it runs tomorrow. Most setups are
			a tower of assumptions — each one quietly holding up the next, none of them written
			down. Touch one and the rest come down.
		</p>
		<p>The usual suspects:</p>
		<ul>
			<li><b>Global installs.</b> <code>pip install</code> straight into the system
				interpreter, so every tweak is system-wide.</li>
			<li><b>Versions pinned by accident.</b> Whatever happened to be current the day you
				started — never chosen, never recorded.</li>
			<li><b>"Works on my machine."</b> The setup lives in your shell history and your
				memory, not in the repo.</li>
			<li><b>Silent drift.</b> An OS update or a stray <code>pip install</code> for another
				task moves a dependency out from under you.</li>
		</ul>
		<p>
			None of these are exotic. Together they make a setup that is <i>fragile by
			default</i> — and the fix starts with admitting that.
		</p>
	</div>
</ContentPage>
