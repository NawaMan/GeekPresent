<!--
  Example: Terminal component
  File: src/routes/slides/terminal-component.html/+page.svelte

  A fake console that types a command, thinks, and prints its output. The typing is a
  pure CSS @keyframes animation rather than a timer, which is what makes the session
  seekable: the Terminal owns that one clock, so it can hold at frame 0 behind a play
  button, stop dead on a command, and be scrubbed back character by character.

  `keys="global"` makes it a BUILD: Space plays on to the end of the next command's
  output and stops. Once the last command is behind the playhead, Space falls through and
  pages the deck — the same handoff a <Steps> run makes, through the same `activeSteps`
  store, so CONTINUE drives it too.

  No <AnimationBar /> here on purpose: with `controls` on, the Terminal drives its own
  playhead, and the bar would collect the same animations and fight it. `controls={false}`
  is the way to hand the clock back to a bar.
-->
<script lang="ts">
	import ContentPage  from '$lib/templates/ContentPage.svelte';
	import Terminal     from '$lib/components/Terminal.svelte';
	import QuickCode    from '$lib/components/QuickCode.svelte';
	import Block        from '$lib/components/Block.svelte';
	import Hint         from '$lib/components/Hint.svelte';
	import ViewSource   from '$lib/components/ViewSource.svelte';
	import source       from './+page.svelte?raw';

	const path = 'src/routes/slides/terminal-component.html/+page.svelte';

	// `{ cmd }` is typed after the prompt; `{ out }` is printed. A bare string is
	// shorthand for an output line — the common case, so it stays out of the way.
	const session = [
		{ cmd: 'pnpm build' },
		'vite v5.4.2  building SSR bundle...',
		{ out: '✓ 128 modules transformed', tone: 'ok' as const },
		{ out: 'warning: 1 chunk is larger than 500 kB', tone: 'warn' as const },
		{ cmd: './build-static.sh ./dist' },
		{ out: 'prerendered 41 routes → dist/', tone: 'muted' as const },
		{ out: '✓ done in 3.4s', tone: 'ok' as const }
	];
</script>

<ContentPage title="Terminal" subtitle="A typed command, its output — on the animation clock">
	<div style="max-width: 800px;">
		<p>
			<b>Terminal</b> types a command out character by character, pauses as if thinking, then
			prints the output — <code>ok</code> / <code>warn</code> / <code>error</code> /
			<code>muted</code> tones, all <code>roles.css</code> tokens (<code>--terminal-*</code>).
		</p>
		<p style="margin-top: 0.6em;">
			The typing is plain CSS <code>@keyframes</code>, never a timer — so the session is
			<b>seekable</b>: it waits behind a play button, and <code>keys="global"</code> lets
			<b>Space</b> run it one command at a time, then page the deck when it's spent.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. fill=false
     keeps QuickCode at its natural size instead of stretching to the box. -->
<Block name="usage" x={980} y={220} width={840} height={280} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<Terminal
  title="zsh — geekpresent"
  keys="global"  <!-- Space steps -->
  lines={[
    { cmd: 'pnpm build' },
    'vite v5.4.2  building...',
    { out: '✓ done', tone: 'ok' },
  ]}
/>`} />
</Block>

<!-- The console itself, in a Block so LAYOUT mode can place and size it. Block fills
     its content, so the Terminal stretches to the box and its screen scrolls if the
     session outgrows the space. -->
<Block name="console" x={120} y={570} width={1680} height={400} grid={10}>
	<Terminal title="zsh — geekpresent" keys="global" lines={session} />
</Block>

<Hint text="Click ▶ or press Space to run one command at a time — or drag the bar to seek" />

<ViewSource {source} {path} />
