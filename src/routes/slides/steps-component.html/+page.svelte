<!--
  Example: Steps / Fragment component
  File: src/routes/slides/steps-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import QuickCode   from '$lib/components/QuickCode.svelte';
	import Steps       from '$lib/components/Steps.svelte';
	import Fragment    from '$lib/components/Fragment.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/steps-component.html/+page.svelte';
</script>

<ContentPage title="Steps & Fragment" subtitle="Accumulating Space reveal — the classic build">
	<div style="max-width: 780px;">
		<p>
			Wrap content in <b>Steps</b>; mark the pieces to reveal one at a time with
			<b>Fragment</b>. Tap <code>Space</code> to build up, <code>Shift+Space</code> to
			peel back — and once the build is spent, <code>Space</code> pages to the next
			slide. The <code>→</code>/<code>←</code> arrows always page, build or no build.
		</p>

		<QuickCode style="margin-top: 0.6em;" lang="svelte" code={`<Steps>
  <p>Shown right away.</p>
  <Fragment tag="p">
    Appears on Space
  </Fragment>
  <Fragment tag="p" transition="fly">
    then this
  </Fragment>
</Steps>`} />

		<p style="margin-top: 0.7em; opacity: 0.8;">
			Fragments reserve their space (no reflow) and inherit the <code>Steps</code>
			transition — <code>fade</code>, <code>fly</code>, <code>slide</code>,
			<code>scale</code> or <code>none</code> — each overridable per Fragment.
		</p>
	</div>
</ContentPage>

<!-- A live build on the right: the base line shows immediately, each Fragment
     arrives on the next Space. Parked in a Block so it can be placed in ADJUST mode. -->
<Block name="demo" x={900} y={250} width={900} height={560} grid={10}>
	<Steps transition="fly">
		<div style="font-size: 1.35em; line-height: 1.6em;">
			<div style="opacity: 0.7; margin-bottom: 0.4em;">A pipeline, one stage at a time:</div>
			<Fragment tag="div" style="margin-bottom: 0.3em;">① Parse the request</Fragment>
			<Fragment tag="div" style="margin-bottom: 0.3em;">② Validate &amp; authorize</Fragment>
			<Fragment tag="div" style="margin-bottom: 0.3em;">③ Run the query</Fragment>
			<Fragment tag="div" transition="scale" style="margin-top: 0.8em;">
				<Callout kind="tip" title="…and reveal the punchline">
					Build spent — one more <code>Space</code> now pages to the next slide.
				</Callout>
			</Fragment>
		</div>
	</Steps>
</Block>

<Hint text="Tap Space (or click CONTINUE) to build the list, Shift+Space to step back" />

<ViewSource {source} {path} />
