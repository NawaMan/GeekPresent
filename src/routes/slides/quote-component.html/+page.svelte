<!--
  Example: Quote component
  File: src/routes/slides/quote-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Quote       from '$lib/components/Quote.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';
	import grace       from './grace.svg';

	const path = 'src/routes/slides/quote-component.html/+page.svelte';
</script>

<ContentPage title="Quote" subtitle="Pull-quotes with attribution & avatar">
	<div style="max-width: 760px;">
		<p>
			<b>Quote</b> is a blockquote with a decorative mark, a left accent rule,
			and a footer carrying the speaker — an <b>avatar</b>, their name and a
			role line.
		</p>
		<p style="margin-top: 0.6em;">
			Give it an <code>avatar</code> image (import it) or none: with no image it
			draws an <b>initials disc</b> from the author, so a quote needs no picture
			to look finished. Every colour is a <code>--quote-*</code> role token.
		</p>
	</div>
</ContentPage>

<!-- Usage sample, parked top-right so it clears the intro on the left. -->
<Block name="usage" x={980} y={250} width={840} height={230} grid={10} fill={false}>
	<QuickCode>
		&lt;Quote author="Grace Hopper"<br/>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;role="Rear Admiral, US Navy" {'{avatar}'}&gt;<br/>
		&nbsp;&nbsp;We've always done it this way.<br/>
		&lt;/Quote&gt;<br/>
		<br/>
		&lt;Quote border radius="18px"<br/>
		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;background="#12181f" ... /&gt;
	</QuickCode>
</Block>

<!-- Left-aligned, image avatar, left rule + mark. -->
<Block name="left" x={120} y={560} width={820} height={360} grid={10}>
	<Quote author="Grace Hopper" role="Rear Admiral, US Navy" avatar={grace}>
		The most dangerous phrase in the language is: we've always done it this way.
	</Quote>
</Block>

<!-- Bordered "card" with a background: the mark sits inside the top of the frame.
     Centered, initials-disc fallback. -->
<Block name="right" x={1000} y={560} width={840} height={210} grid={10}>
	<Quote
		align="center"
		border
		background="color-mix(in srgb, var(--ACCENT, #2980b9) 12%, #12181f)"
		text="Premature optimization is the root of all evil."
		author="Donald Knuth"
		role="The Art of Computer Programming" />
</Block>

<Hint text="Flip LAYOUT (top-right) to place & resize either quote" />

<ViewSource {source} {path} />
