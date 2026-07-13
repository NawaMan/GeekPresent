<!--
  Example: ANNOTATE (2 of 3: the ink stays).
  File: src/routes/slides/annotate-persistence.html/+page.svelte

  The payoff slide, and it only works if the audience drew on the PREVIOUS one: page back
  and the ink is still there. That single fact is what the whole design turns on — keeping
  ink is what makes a marked-up deck survive the walk to the podium, and it is also what
  lets last week's rehearsal marks ambush you in front of an audience. Hence the reminder.
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import Block       from '$lib/components/Block.svelte';
	import Callout     from '$lib/components/Callout.svelte';
	import Hint        from '$lib/components/Hint.svelte';
	import ViewSource  from '$lib/components/ViewSource.svelte';
	import source      from './+page.svelte?raw';

	const path = 'src/routes/slides/annotate-persistence.html/+page.svelte';
</script>

<ContentPage title="Annotate" subtitle="The ink stays — which is the good news and the bad news">
	<div style="line-height: 1.55em;">
		<p>
			Page <b>back</b> one slide. Your ink is still there &mdash; and it would still be there
			after a reload, or tomorrow. Strokes are filed under the slide they were drawn on and
			remembered, so a deck you marked up while preparing arrives at the podium marked up.
		</p>
	</div>
</ContentPage>

<Block name="keeping" x={65} y={400} width={860} height={280}>
	<Callout kind="tip" title="Clearing it">
		<p><b>UNDO</b> takes back the last stroke.</p>
		<p style="margin-top: 0.4em;">
			<b>RESET</b> clears this slide. <b>RESET ALL</b> clears every slide in the deck.
		</p>
		<p style="margin-top: 0.4em;">
			Both are on the pen's bar &mdash; and both are in the <b>presenter console</b> too,
			under <b>✎</b>, so you can wipe a slide from the speaker's screen without hunting for
			the pen on the projector.
		</p>
	</Callout>
</Block>

<!-- The interesting half, on the slide rather than hidden — the same way layout-mode.html puts
     SAVE's refusal in front of the audience instead of behind it. -->
<Block name="stale" x={995} y={400} width={860} height={280}>
	<Callout kind="warn" title="…so it can go stale">
		<p>
			Ink that outlives the talk can <i>ambush</i> the next one. Marks from a rehearsal are
			still marks, and the audience sees them before you do.
		</p>
		<p style="margin-top: 0.4em;">
			So a slide whose ink is more than <b>a day</b> old says so when you arrive &mdash;
			<i>“This slide has annotations from 3 days ago”</i> &mdash; and offers to clear them.
			Today's marks never nag; last week's always do.
		</p>
		<p style="margin-top: 0.4em;">
			<b>KEEP</b> means “not now”, not “never again”.
		</p>
	</Callout>
</Block>

<Block name="draw-here" x={61} y={782} width={1790} height={110}>
	<div class="demo">Draw here too — then reload the page. It survives.</div>
</Block>

<Hint text="Page back to see the ink you left — or reload this page and watch it come back" />

<ViewSource {source} {path} />

<style>
	.demo {
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		border-radius: 12px;
		font-size: 1.35em;
		background: #1f3a4d;
		border: 2px solid #2980b9;
		color: #c0f1ff;
	}
</style>
