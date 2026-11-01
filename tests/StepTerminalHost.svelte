<!-- StepTerminal fixture: two consoles and a Fragment in one Steps build, as the
     reference slide has them — or one console with no Steps around it. -->
<script lang="ts">
	import Steps from '../src/lib/components/Steps.svelte';
	import Fragment from '../src/lib/components/Fragment.svelte';
	import StepTerminal from '../src/lib/components/StepTerminal.svelte';

	export let inSteps = true;
	export let autoplay = false;

	// Two logical commands: the second is continued over two lines.
	const first = [
		{ cmd: 'git push' },
		{ out: 'pushed' },
		{ cmd: 'gh run watch \\' },
		{ cmd: '--exit-status', cont: true },
		{ out: 'ok' }
	];
	const second = [
		{ cmd: 'curl health' },
		{ out: '{"ok":true}' },
		{ cmd: 'uptime' },
		{ out: 'up 3 days' }
	];
</script>

{#if inSteps}
	<Steps>
		<StepTerminal title="first" lines={first} {autoplay} />
		<Fragment tag="p">between</Fragment>
		<StepTerminal title="second" lines={second} />
	</Steps>
{:else}
	<StepTerminal title="alone" lines={first} />
{/if}
