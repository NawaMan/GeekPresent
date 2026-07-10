<!--
  Example: Kbd component
  File: src/routes/slides/kbd-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Kbd         from '$lib/components/Kbd.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/kbd-component.html/+page.svelte';

	// The same shortcut, said to two audiences. `Mod` is what makes that possible.
	const shortcuts = [
		{ keys: 'Mod+Shift+P', what: 'Command palette' },
		{ keys: 'Mod+K Mod+S', what: 'Keyboard shortcuts' },
		{ keys: 'Mod+/',       what: 'Toggle comment' },
		{ keys: 'Alt+Up',      what: 'Move line up' },
	];
</script>

<ContentPage title="Kbd" subtitle="Keyboard keys, drawn as keycaps">
	<div style="max-width: 800px;">
		<p>
			A shortcut is one string: whitespace separates <b>chords</b>, <code>+</code>
			separates the keys within one. So <code>"Ctrl+K Ctrl+S"</code> is
			<Kbd keys="Ctrl+K Ctrl+S" />.
		</p>
		<p style="margin-top: 0.6em;">
			<code>Mod</code> is the portable modifier — <Kbd keys="Mod" /> on a PC,
			<Kbd keys="Mod" platform="mac" /> on a Mac. Write the shortcut once; the
			slide says it correctly to whoever is looking at it.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. fill=false
     keeps QuickCode at its natural size instead of stretching to the box. -->
<Block name="usage" x={940} y={250} width={880} height={260} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<Kbd keys="Mod+Shift+P" />
<Kbd keys="Mod+Shift+P" platform="mac" />
<Kbd keys="Ctrl+K Ctrl+S" />
<Kbd>Any</Kbd>`} />
</Block>

<!-- The same four shortcuts, side by side on both keyboards: the PC column spells
     its modifiers out, the Mac column runs its glyphs together. Same `keys`. -->
<Block name="table" x={120} y={600} width={1000} height={340} grid={10}>
	<table>
		<thead>
			<tr><th>Command</th><th>PC</th><th>Mac</th></tr>
		</thead>
		<tbody>
			{#each shortcuts as { keys, what }}
				<tr>
					<td>{what}</td>
					<td><Kbd {keys} /></td>
					<td><Kbd {keys} platform="mac" /></td>
				</tr>
			{/each}
		</tbody>
	</table>
</Block>

<!-- Caps size in `em`, so they track whatever text they sit in. -->
<Block name="scale" x={1200} y={600} width={620} height={340} grid={10}>
	<div class="scale">
		<h2>A cap in a heading <Kbd keys="Esc" /></h2>
		<p>…and in a paragraph <Kbd keys="Esc" />, and in small print
			<small><Kbd keys="Esc" /></small>.</p>
		<p style="margin-top: 0.8em;">
			Arrows are glyphs on both keyboards:
			<Kbd keys="Up" /> <Kbd keys="Down" /> <Kbd keys="Left" /> <Kbd keys="Right" />
		</p>
	</div>
</Block>

<Hint text="Same `keys` in both columns — only `platform` differs" />

<ViewSource {source} {path} />

<style>
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 1.05em;
	}
	th {
		text-align: left;
		font-weight: 600;
		opacity: 0.6;
		padding-bottom: 0.4em;
		border-bottom: 1px solid color-mix(in srgb, var(--surface-fg, #c0f1ff) 25%, transparent);
	}
	td {
		padding: 0.55em 1.2em 0.55em 0;
		vertical-align: middle;
	}
	.scale h2 {
		font-size: 1.6em;
		margin: 0 0 0.4em;
	}
	.scale p {
		margin: 0;
	}
</style>
