<!-- StepDots fixture: a three-Fragment Steps build beside the indicator, as SlideDeck
     mounts it — the two only meet through the activeSteps store. -->
<script lang="ts">
	import Steps from '../src/lib/components/Steps.svelte';
	import Fragment from '../src/lib/components/Fragment.svelte';
	import StepDots from '../src/lib/components/StepDots.svelte';

	export let build = true;
	export let position: import('../src/lib/utils/stepDotsCore').StepDotsPosition = 'bottom';
</script>

{#if build}
	<Steps>
		<Fragment tag="p">one</Fragment>
		<Fragment tag="p">two</Fragment>
		<Fragment tag="p">three</Fragment>
	</Steps>
{/if}
<StepDots {position} />
