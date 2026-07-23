<!--
  Example: KIOSK's floating panel at zero idle opacity — invisible until asked for.

  File: src/routes/slides/kiosk-demo.html/+page.svelte

  `--kiosk-idle` (src/lib/themes/roles.css) defaults to 0.6 so the panel stays findable
  by mouse. This slide overrides it to 0 with a scoped `:global(.kiosk-panel)` rule — a
  full-page slide nav means that override lives only while THIS route is mounted, so it
  demonstrates the setting without changing it deck-wide. It is safe to go this low only
  because Alt+. K/U now reach the panel without a mouse at all (chrome/chromeArmCore.ts).
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Block from '$lib/components/Block.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Hint from '$lib/components/Hint.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/kiosk-demo.html/+page.svelte';

	const css = `:global(.kiosk-panel) {
  --kiosk-idle: 0;
}`;
</script>

<ContentPage title="Kiosk" subtitle="The panel, invisible until you ask for it">
	<div style="line-height: 1.55em;">
		<p>
			<code>--kiosk-idle</code> is <code>0.6</code> by default &mdash; enough to stay
			findable by mouse. This slide sets it to <code>0</code>. Try it: open ☰ &rarr;
			<b>KIOSK</b> &rarr; Start, then watch the bottom-left corner. Nothing is there.
		</p>
	</div>
</ContentPage>

<Block name="code" x={65} y={370} width={880} height={260}>
	<QuickCode lang="css" code={css} />
</Block>

<Block name="keys" x={65} y={660} width={880} height={270}>
	<div class="keys">
		<p><kbd>Alt</kbd>+<kbd>.</kbd> then <kbd>K</kbd> &mdash; reveal / hide the panel (only while a kiosk is running or paused; while off, it still opens the setup dialog).</p>
		<p><kbd>Alt</kbd>+<kbd>.</kbd> then <kbd>U</kbd> &mdash; pause / resume, no mouse required.</p>
		<p>Hovering the panel reveals it too (plain CSS <code>:hover</code>) &mdash; and freezes the countdown while your pointer sits on it, without changing the play/pause mode itself, resuming exactly where it left off the moment you move off.</p>
	</div>
</Block>

<Block name="why" x={995} y={367} width={860} height={330}>
	<Callout kind="info" title="Why the default isn't 0">
		<p>
			Every auto-hiding GeekPresent control &mdash; <code>fadeChrome</code>, the Annotate
			bar, this panel &mdash; follows the same rule: <b>opacity, never visibility</b>. Zero
			opacity is not just dim, it's <i>undiscoverable</i> &mdash; nothing on screen hints
			where to hover. The idle default stays at <code>0.6</code> deck-wide for that reason.
		</p>
		<p style="margin-top: 0.4em;">
			Going lower is only safe once there's a way to summon the control that doesn't
			depend on already seeing it &mdash; which is what Alt+. K/U are for.
		</p>
	</Callout>
</Block>

<Block name="try" x={995} y={730} width={860} height={200}>
	<Callout kind="tip" title="Wire it into your own deck">
		<p>
			Scope the same <code>:global(.kiosk-panel) &#123; --kiosk-idle: 0; &#125;</code> rule to
			one slide (as here), a deck's <code>+layout.svelte</code> for the whole show, or
			<code>src/lib/themes/roles.css</code> to change every deck's default.
		</p>
	</Callout>
</Block>

<Hint text="Alt+. then K reveals/hides the panel; Alt+. then U pauses/resumes — both work even though the panel starts fully invisible" />

<ViewSource {source} {path} />

<style>
	.keys p {
		margin-bottom: 0.6em;
		line-height: 1.5;
		font-size: 1.05em;
	}
	.keys kbd {
		display: inline-block;
		padding: 0.1em 0.5em;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.3);
		background: rgba(255, 255, 255, 0.08);
		font-family: ui-monospace, monospace;
		font-size: 0.95em;
	}

	/* The whole point of the slide — scoped to this route only, since deck navigation is
	   a full page load (see AGENTS.md). Leaving this slide restores the deck's normal
	   0.6 idle opacity everywhere else. */
	:global(.kiosk-panel) {
		--kiosk-idle: 0;
	}
</style>
