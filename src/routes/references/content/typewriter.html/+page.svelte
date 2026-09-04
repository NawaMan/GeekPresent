<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode from '$lib/components/QuickCode.svelte';
	import Callout from '$lib/components/Callout.svelte';
</script>

<ContentPage title="Typewriter" subtitle="Text that types itself, character by character">
	<div style="width: 100%; line-height: 1.5;">
		<p><b>Typewriter</b> reveals its <code>text</code> one character at a time, in the deck's own font, wrapping like the prose it is. <b>Terminal</b> is the same reveal locked inside a monospace console.</p>

	<QuickCode style="margin-top: 0.7em;" lang="svelte" code={`<Typewriter tag="h1" text="One character at a time." />`} />

	<p style="margin-top: 0.7em; opacity: 0.85;"><b>Props that matter</b></p>
	<ul style="margin: 0.3em 0 0 1.2em; line-height: 1.45;">
			<li><code>charMs / startMs</code> — pace, and dead air (stagger several with it)</li>
			<li><code>punctuationMs</code> — extra beat after a clause ender; 0 is a flat rate</li>
			<li><code>caret={'{false}'}</code> — no cursor; the reveal is unchanged</li>
			<li><code>startOn</code> — hold at frame 0 until a named trigger pulses</li>
	</ul>

	<Callout kind="tip" title="It is CSS, not a timer" style="margin-top: 0.8em;">
		One animation per character, so an <code>AnimationBar</code> scrubs it — backwards too — and the finished sentence is what prerenders and prints.
	</Callout>
	</div>
</ContentPage>
