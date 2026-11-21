<!-- Auto-level fixture: a real SlideDeck around a three-Fragment build, so the deck's
     countdown, the build's `busy` report and the StepDots hint are the ones that ship. -->
<script lang="ts">
	import SlideDeck from '$lib/components/SlideDeck.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import Fragment from '$lib/components/Fragment.svelte';

	export let pages: Record<string, unknown>[] = [];
	/** The deck's wait. */
	export let stepTimeoutMs: number | undefined = undefined;
	/** The build's own wait. */
	export let timeoutMs: number | undefined = undefined;
</script>

<SlideDeck pages={pages as never} {stepTimeoutMs}>
	<Steps {timeoutMs} transition="none">
		<Fragment tag="p">one</Fragment>
		<Fragment tag="p">two</Fragment>
		<Fragment tag="p">three</Fragment>
	</Steps>
</SlideDeck>
