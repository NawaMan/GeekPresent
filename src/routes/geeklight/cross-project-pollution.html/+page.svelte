<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import pollution   from './pollution.png';
</script>

<ContentPage title="Cross-project pollution" subtitle="One interpreter, many projects, no agreement">
	<div style="font-size: 0.85em;">
		<p>
			Project A needs Python 3.12 and the newest <code>requests</code>. Project B is stuck on
			3.9 and an older pin. Share a single global interpreter and they fight over it — every
			install for one project silently rewrites the world for the other.
		</p>
		<img src={pollution} alt="Two project folders forced to share one Python install" />
		<p>
			The result is the worst kind of bug: the one that appears only after you worked on
			something <i>else</i>. Isolation per project is the way out.
		</p>
	</div>

	<style>
		img {
			display: block;
			width: 100%;
			max-width: 620px;
			margin: 0.8em auto;
			border-radius: 8px;
		}
	</style>
</ContentPage>
