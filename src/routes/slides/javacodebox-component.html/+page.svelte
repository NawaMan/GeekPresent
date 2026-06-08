<!--
  Example: JavaCodeBox component
  File: src/routes/slides/javacodebox-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import JavaCodeBox  from '$lib/components/JavaCodeBox.svelte';

	let show = false;

	const code = `public class Solution {
    public static void main(String[] args) {
        var sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        System.out.println(sum); // 5050
    }
}`;
</script>

<ContentPage title="JavaCodeBox" subtitle="JavaCode inside an expandable Box">
	<div style="font-size: 0.8em;">
		<p>
			Keep a solution hidden until you are ready, then pop it up full-screen.
			Wraps <b>JavaCode</b>, so it keeps the <b>custom Java folding</b> (imports + braces).
		</p>
		<button
			style="padding: 0.5em 1em; font-size: 1em; cursor: pointer; background: #2980b9; color: white; border: none; border-radius: 4px;"
			on:click={() => show = true}>
			Reveal solution
		</button>
		<div style="font-family: monospace; font-size: 0.85em; background: #111; padding: 0.5em 1em; border-radius: 5px; line-height: 1.8em; margin-top: 0.6em;">
			&lt;JavaCodeBox javaCode=&#123;code&#125; title="Solution.java" expanded=&#123;show&#125; revealedLines=&#123;[1]&#125; /&gt;
		</div>
		<p style="margin-top: 0.5em; opacity: 0.7; font-size: 0.85em;">
			Click CLOSE, click outside, or press Escape to dismiss. (Monaco loads from a CDN &mdash; needs internet.)
		</p>
	</div>
</ContentPage>

<JavaCodeBox javaCode={code} title="Solution.java" bind:expanded={show} revealedLines={[1]} />
