<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import Fragment from '$lib/components/Fragment.svelte';
	import StepTerminal from '$lib/components/StepTerminal.svelte';

	// The first console autoplays its first command on arrival; every command after that,
	// the line of text, and the second console's commands are one Space each.
	/** @type {import('$lib/utils/terminalCore').TerminalInput[]} */
	const laptop = [
		{ cmd: 'git push origin main' },
		{ out: '✓ pushed 3 commits', tone: 'ok' },
		{ cmd: 'gh run watch \\' },
		{ cmd: '--exit-status', cont: true },
		{ out: '✓ build  ✓ test  ✓ deploy', tone: 'ok' }
	];
	/** @type {import('$lib/utils/terminalCore').TerminalInput[]} */
	const server = [
		{ cmd: 'curl -s localhost/health' },
		{ out: '{"status":"ok","version":"0.6.0"}' },
		{ cmd: 'journalctl -u app -n 2' },
		{ out: 'app: listening on :8080', tone: 'muted' },
		{ out: 'app: ready', tone: 'ok' }
	];
</script>

<ContentPage title="StepTerminal" subtitle="Several consoles, one Space sequence">
	<p style="margin: 0 0 0.6em; line-height: 1.4;">
		Press <b>Space</b>. The left console's first command played on arrival (<code>autoplay</code>);
		each further command, the line below and each command on the right is one step. The continued
		<code>gh run watch \</code> is one step, not two. Once a step has finished, the dots at the bottom
		blink and say so.
	</p>

	<Steps>
		<div style="display: flex; gap: 40px; align-items: flex-start;">
			<div style="flex: 1; min-width: 0;">
				<StepTerminal title="laptop" lines={laptop} autoplay />
			</div>
			<div style="flex: 1; min-width: 0;">
				<Fragment tag="p" style="margin: 0 0 0.5em;">Then check it on the server:</Fragment>
				<StepTerminal title="server" lines={server} />
			</div>
		</div>
	</Steps>
</ContentPage>
