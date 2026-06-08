<!--
  Example: CodeBox component
  File: src/routes/slides/codebox-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import CodeBox     from '$lib/components/CodeBox.svelte';

	let show = false;

	const code = `function sumTo(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
}

console.log(sumTo(100)); // 5050`;
</script>

<ContentPage title="CodeBox" subtitle="Code inside an expandable Box (any language)">
	<div style="font-size: 0.8em;">
		<p>Like JavaCodeBox, but for any language &mdash; pass <code>language</code> and an optional <code>title</code>:</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => show = true}>
			Reveal code
		</button>
		<div style="font-family: monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em; margin-top: 0.6em;">
			&lt;CodeBox code=&#123;code&#125; language="javascript" title="sum.js" expanded=&#123;show&#125; /&gt;
		</div>
		<p style="margin-top: 0.5em; opacity: 0.7; font-size: 0.85em;">
			Click CLOSE, click outside, or press Escape to dismiss. (Monaco loads from a CDN &mdash; needs internet.)
		</p>
	</div>
</ContentPage>

<CodeBox code={code} language="javascript" title="sum.js" bind:expanded={show} revealedLines={[1]} />
