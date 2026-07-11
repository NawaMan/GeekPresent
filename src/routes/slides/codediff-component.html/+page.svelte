<!--
  Example: CodeDiff component
  File: src/routes/slides/codediff-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CodeDiff    from '$lib/components/CodeDiff.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/codediff-component.html/+page.svelte';

	// Left demo: hand it two versions, it computes the diff.
	const before = `function greet(who) {
  return "Hello " + who;
}`;
	const after = `function greet(who) {
  return \`Hello, \${who}!\`;
}`;
</script>

<ContentPage title="CodeDiff" subtitle="Show the change — added & removed lines, side by side">
	<div style="max-width: 900px;">
		<p>
			QuickCode shows a snippet and Code shows a file; <b>CodeDiff shows a
			<i>change</i></b> — the line you added, the line you took out. Each line gets a
			<code>+</code>/<code>−</code> gutter and a green/red wash, with optional
			old/new line numbers.
		</p>
		<p style="margin-top: 0.6em;">
			Author it two ways: hand it <code>before</code> and <code>after</code> and the
			diff is computed for you (left), or write a git-style <code>diff</code> block to
			say exactly what changed (right). It's Shiki-highlighted and SSR-safe, like
			QuickCode.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. -->
<Block name="usage" x={1030} y={250} width={800} height={210} grid={10} fill={false}>
	<QuickCode lang="svelte" code={`<CodeDiff
  lang="python"
  lineNumbers
  before={oldSrc}
  after={newSrc} />`} />
</Block>

<!-- Left: computed from two versions. -->
<Block name="computed" x={90} y={600} width={840} height={340} grid={10}>
	<CodeDiff {before} {after} lang="javascript" summary />
</Block>

<!-- Right: an explicit git-style block, with line numbers. -->
<Block name="explicit" x={1020} y={560} width={820} height={400} grid={10}>
	<CodeDiff lang="python" lineNumbers diff={` def greet(who):
-    return "Hello " + who
-    # old, string-concat style
+    # f-strings read better
+    return f"Hello, {who}!"

 print(greet("world"))`} />
</Block>

<Hint text="before/after computes the diff; a diff string spells it out — flip LAYOUT to place either" />

<ViewSource {source} {path} />
