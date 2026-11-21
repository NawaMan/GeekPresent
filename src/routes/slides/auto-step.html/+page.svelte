<!--
  Example: a build that goes on by itself (the auto levels), and StepTerminal's `stopAt`
  File: src/routes/slides/auto-step.html/+page.svelte

  A console that asks questions should not wait for ever. `timeoutMs` on the <Steps> makes
  the build take its next step by itself, five seconds after the step before it finished
  playing. Steps only: when the build is spent, the page turn is still the viewer's Space.

  The same wait can be set for a whole deck (<SlideDeck stepTimeoutMs>) or one slide
  (`stepTimeoutMs` in pages.ts); the narrowest wins. The viewer can hold it: a click on the
  "SPACE for next step" hint, or Alt+. then H. `?auto=off` / `?auto=steps` do the same from
  a link.

  `stopAt` puts the console's stops where the program waits for input, not after each
  command: `{ before: n }` stops as line n begins, its prompt up and nothing typed. The
  questions are command rows with their own `prompt`; the password is an empty command, so
  nothing is ever typed there, and the caret waits on it.
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import StepTerminal from '$lib/components/StepTerminal.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Block from '$lib/components/Block.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import type { TerminalInput } from '$lib/utils/terminalCore';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/auto-step.html/+page.svelte';

	const session: TerminalInput[] = [
		{ cmd: 'vault init' }, //                                    0
		{ out: 'Setting up a new vault.', tone: 'muted' }, //        1
		{ cmd: 'Ada Lovelace', prompt: 'Your name:' }, //            2  ← a question
		{ cmd: '', prompt: 'Master password:' }, //                  3  ← typed blind
		{ out: '✓ vault created at ~/.vault', tone: 'ok' }, //        4
		{ cmd: 'vault status' }, //                                  5
		{ out: 'unlocked · 0 secrets', tone: 'muted' } //            6
	];
</script>

<ContentPage
	title="A build that goes on by itself"
	subtitle="Steps after a wait — the page turn stays yours"
>
	<div style="max-width: 800px;">
		<p>
			Give a <b>Steps</b> a <code>timeoutMs</code> and a build that has stopped for Space goes on by
			itself after that wait. <b>Space</b> still steps sooner; the page turn stays yours.
		</p>
		<p style="margin-top: 0.6em;">
			The hint counts the wait down. <b>Click it</b> (or <code>Alt+.</code> then <code>H</code>) to
			hold the slide, and again to let it go on.
		</p>
		<p style="margin-top: 0.6em;">
			<code>stopAt</code> stops a console where the program waits for input, each question with its
			own <code>prompt</code>.
		</p>
	</div>
</ContentPage>

<Block name="usage" x={980} y={220} width={840} height={360} grid={10} fill={false}>
	<QuickCode
		lang="svelte"
		style="font-size: 70%"
		code={`<Steps timeoutMs={5000}>
  <StepTerminal autoplay
    stopAt={[{ before: 2 }, { before: 3 }, 4]}
    lines={[
      { cmd: 'vault init' },
      'Setting up a new vault.',
      { cmd: 'Ada Lovelace', prompt: 'Your name:' },
      { cmd: '', prompt: 'Master password:' },
      …
    ]} />
</Steps>`}
	/>
</Block>

<Block name="console" x={120} y={600} width={1680} height={350} grid={10}>
	<Steps timeoutMs={5000}>
		<StepTerminal
			title="zsh — vault"
			autoplay
			stopAt={[{ before: 2 }, { before: 3 }, 4]}
			lines={session}
		/>
	</Steps>
</Block>

<ViewSource {source} {path} />
