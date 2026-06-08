<script lang="ts">
	import CtrlBtn from './CtrlBtn.svelte';
	import { scaleMode } from '$lib/stores/scaleMode';
	import { get } from 'svelte/store';

	let isScaled = get(scaleMode);
	scaleMode.subscribe(value => {
		isScaled = value;
	});

	function toggleScale() {
		scaleMode.update(current => !current);
	}
</script>

<style>
	.mode {
		/* functional */
		position: absolute;
		top: 0px;
		right: 0px;
		margin-right: 0.5em;
	}
</style>

<div class="mode no-print">
	<CtrlBtn text={isScaled ? 'SCALED' : 'FIXED'} hoverText={isScaled ? 'To FIXED mode' : 'To SCALED mode'}  on:click={toggleScale} />
</div>
