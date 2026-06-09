<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

    export let text       = 'Btn';
    export let hoverText  = '';
	export let isSelected = false;
	export let isDisabled = false;
	export let isVisible  = true;

	onMount(() => {
		if (!hoverText) {
			hoverText = text;
		}
	});
</script>

<style>
    button {
		/* functional */
		cursor: pointer;

		/* cosmetic */
		/* A <button> ignores the inherited font-size by default, so it skipped the
		   canvas font-size lever and stayed tiny. Opt in so the control tracks its
		   context; 0.85em keeps it chrome-sized (~1.5x its old browser-default size
		   on the 1920x1080 canvas) and scales with any future portrait layout. */
		font-size: 0.85em;
		padding-left: 0.5em;
		padding-right: 0.5em;
		margin-left: 0.5em;
		text-justify: center;
		text-align: center;
		/* background-color: #061e30; */
		background: #181818;
		color: #333;
		font-weight: bold;
		border: 0px;
	}

	button:hover:not(:disabled) {
		/* cosmetic */
		color: #fff;
		background-color: #2980b9;
	}
	button.selected {
		/* cosmetic */
		color: #fff;
		background-color: #00b356;
	}
	button:active:not(:disabled) {
		/* cosmetic */
		box-shadow: 0 3px #0056b3;
		transform: translateY(4.5px);
	}
	button:disabled {
		/* functional */
		color: #222;
		cursor: default;
	}

	button .hover-text {
		display: none;
	}
	button:hover:not(button.hidden) .hover-text,
	button.selected:not(button.hidden) .hover-text {
		display: inline;
	}
	button:hover    .text,
	button.selected .text {
		display: none;
	}
	button.hidden {
		display: none;
	}
</style>

<button
	disabled={isDisabled}
	class:selected={isSelected}
	class:hidden={!isVisible}
	on:click>
	<span class="text"      >{text}</span>
	<span class="hover-text">{hoverText}</span>
</button>
