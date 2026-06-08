<script>
	import { onMount } from "svelte";

	onMount(() => {
		document.body.classList.remove('rendering');
	});
</script>

<div id="background">
	<div id="main">
		<div>
			<div>Article view is not yet available.</div>
			<div>Check out the <a href="./slides/title.html">presentation slides</a> instead.</div>
		</div>
	</div>
</div>

<style>
	#background {
		background-color: #f0ead2;
		padding: 0px;
		margin: 0px;
		width: 100vw;
		height: 100vh;
		display: flex;
	}

	#main {
		color: black;
		background-color: #fff;
		width: calc(100vw*0.8);
		height: calc(100vh*0.8);
		margin-top: calc(100vh*0.1);
		margin-left: auto;
		margin-right: auto;
		border-radius: 10px;
		text-align: center;
		justify-content: center;
		align-items: center;
		display: flex;

		font-size: x-large;
	}

	a::before,
	a::after {
		content: " ";
	}
</style>
