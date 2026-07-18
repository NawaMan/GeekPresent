<!--
  Example: Toast component
  File: src/routes/slides/toast-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Toast       from '$lib/components/Toast.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/toast-component.html/+page.svelte';

	// Two build flags a click flips on; each Toast clears its own via onclose, so the
	// button re-fires it. This is exactly the shape a Steps build or the presenter
	// console would drive — open the toast, let it dismiss itself.
	let deployed = false;
	let saved = false;
</script>

<ContentPage title="Toast" subtitle="A transient message that can spotlight what it names">
	<div style="max-width: 680px;">
		<p>
			<b>Toast</b> raises a short banner over the live slide that fades itself out — and
			a <code>highlight</code> dims the slide around a named <code>Block</code> on the
			same beat, so “say it” and “point at it” become one call on one timeline.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="svelte" code={`<Toast
  open={deployed}
  highlight="deploy"
  text="Deployed!" />`} />

		<p style="margin-top: 0.7em; opacity: 0.8;">
			Props: <code>open</code>, <code>text</code> (or the slot), <code>highlight</code>,
			<code>duration</code> (<code>0</code> = sticky), <code>placement</code>,
			<code>dim</code>. It ships nothing until opened — SSR-inert, like <code>Spotlight</code>.
		</p>
	</div>
</ContentPage>

<!-- The stage: a named Block the highlighting toast points at (drag it in ADJUST and the
     spotlight follows, because it resolves through blockAnchors like a Connector). -->
<Block name="deploy" x={1200} y={330} width={500} height={190} grid={10}>
	<div class="deploy-card">🚀&nbsp; deploy</div>
</Block>

<button class="fire" style="left: 1200px; top: 560px;" on:click={() => (deployed = true)}>
	Deploy →
</button>
<button class="fire ghost" style="left: 1450px; top: 560px;" on:click={() => (saved = true)}>
	Save
</button>

<!-- A highlighting toast (dims around #deploy) and a plain one at the top. Each clears
     its flag on dismiss so the button re-fires it. -->
<Toast open={deployed} highlight="deploy" text="Deployed!" icon="🚀" onclose={() => (deployed = false)} />
<Toast open={saved} text="Saved ✓" placement="top" duration={1800} onclose={() => (saved = false)} />

<Hint text="Press Deploy — the toast fires and the box lights up; flip ADJUST and drag the box, the spotlight tracks it" />

<ViewSource {source} {path} />

<style>
	.deploy-card {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: 2px dashed rgba(240, 163, 62, 0.7);
		border-radius: 14px;
		background: rgba(240, 163, 62, 0.08);
		color: var(--INK, #d7dde5);
		font-size: 2.2rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.fire {
		position: absolute;
		z-index: 4;
		padding: 0.6em 1.4em;
		border-radius: 10px;
		border: 1px solid var(--ACCENT-WARM, #f0a33e);
		background: var(--ACCENT-WARM, #f0a33e);
		color: #1a1206;
		font-size: 1.4rem;
		font-weight: 600;
		cursor: pointer;
	}
	.fire.ghost {
		background: transparent;
		color: var(--ACCENT-WARM, #f0a33e);
	}
	.fire:hover {
		filter: brightness(1.08);
	}
</style>
