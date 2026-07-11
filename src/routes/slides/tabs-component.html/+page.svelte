<!--
  Example: Tabs / Tab components
  File: src/routes/slides/tabs-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Tabs        from '$lib/components/Tabs.svelte';
	import Tab         from '$lib/components/Tab.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/tabs-component.html/+page.svelte';
</script>

<ContentPage title="Tabs" subtitle="Switch between panels in one slide — the same thing, N ways">
	<div style="max-width: 860px;">
		<p>
			<b>Tabs</b> is the container; <b>Tab</b> is one panel of it. Each
			<code>Tab</code> carries its own <code>label</code> (and optional
			<code>icon</code>) — those travel up to the strip; the content stays put.
			One panel shows at a time.
		</p>
		<p style="margin-top: 0.6em;">
			Click a tab, or <b>focus the strip and use ←/→</b> (Home/End too) — it
			claims the arrows only while a tab is focused, so the deck pages again the
			instant focus leaves. The panels are grid-stacked, so switching never jumps
			the strip.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. -->
<Block name="usage" x={1000} y={250} width={820} height={230} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<Tabs>
  <Tab label="JavaScript">…</Tab>
  <Tab label="Python" icon="🐍">…</Tab>
  <Tab label="Go">…</Tab>
</Tabs>`} />
</Block>

<!-- The demo: one greeting in three languages. Parked in a Block so LAYOUT mode can
     move and resize it; Block fills its content, so the tab group stretches to the box. -->
<Block name="demo" x={120} y={560} width={1000} height={360} grid={10}>
	<Tabs>
		<Tab label="JavaScript">
			<QuickCode style="margin: 0;" lang="javascript" code={`const greet = (who) =>
  \`Hello, \${who}!\`;

console.log(greet("world"));`} />
		</Tab>
		<Tab label="Python" icon="🐍">
			<QuickCode style="margin: 0;" lang="python" code={`def greet(who):
  return f"Hello, {who}!"

print(greet("world"))`} />
		</Tab>
		<Tab label="Go" icon="🐹">
			<QuickCode style="margin: 0;" lang="go" code={`func greet(who string) string {
  return "Hello, " + who + "!"
}

fmt.Println(greet("world"))`} />
		</Tab>
		<Tab label="Rust (soon)" disabled>
			Coming soon.
		</Tab>
	</Tabs>
</Block>

<Hint text="Focus a tab and press ←/→ — or flip LAYOUT to place & resize the group" />

<ViewSource {source} {path} />
