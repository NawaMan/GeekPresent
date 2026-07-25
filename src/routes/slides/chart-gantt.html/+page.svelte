<!--
  Example: Gantt — tasks as spans on a time axis
  File: src/routes/slides/chart-gantt.html/+page.svelte

  A database migration plan, which is the shape this chart is for: phases that
  OVERLAP, a dependency chain, a cutover milestone, progress on the work already
  underway, and a `today` rule putting the audience somewhere in the story.

  Everything on show is real data in the array below — the dates are ISO strings
  (`toTime` also takes Date objects and raw timestamps), the arrows are declared
  by TASK NAME via `dependsOn`, and "Rollback drill" deliberately carries no
  dates: it keeps its lane on the axis and draws no bar, because dropping the row
  would silently shorten the plan.

  Chart geometry is pure in $lib/chart/chartCore.ts (ganttBars / ganttLinks).
-->
<script lang="ts">
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ViewSource from '$lib/components/ViewSource.svelte';
	import { Gantt } from '$lib/chart';
	import source from './+page.svelte?raw';

	const path = 'src/routes/slides/chart-gantt.html/+page.svelte';

	type Phase = {
		phase: string;
		from: string;
		to?: string | null;
		done?: number;
		after?: string | string[];
	};

	// One plan. The dependency chain is genuinely FINISH-TO-START — each dependent
	// begins where its predecessor ends — because that is the only relationship
	// this chart can express. Two rows deliberately break the mould, and both are
	// called out in the caption:
	//   • "Write runbook" overlaps the chain but declares NO dependency. That is
	//     the honest way to show two things running at once: parallel work, not a
	//     dependency that contradicts itself.
	//   • "Drop old tables" says it waits for the cutover, then starts five days
	//     BEFORE it — an impossible plan, and exactly what the dashed warn arrow
	//     is for.
	const plan: Phase[] = [
		{ phase: 'Audit schema', from: '2026-03-02', to: '2026-03-13', done: 100 },
		{ phase: 'Dual-write', from: '2026-03-13', to: '2026-03-27', done: 70, after: 'Audit schema' },
		{ phase: 'Write runbook', from: '2026-03-16', to: '2026-04-03', done: 40 }, // parallel, unlinked
		{ phase: 'Backfill', from: '2026-03-27', to: '2026-04-10', done: 25, after: 'Dual-write' },
		{ phase: 'Shadow reads', from: '2026-04-10', to: '2026-04-17', after: 'Backfill' },
		{ phase: 'Cutover', from: '2026-04-20', after: 'Shadow reads' }, // no `to` → milestone
		{ phase: 'Drop old tables', from: '2026-04-15', to: '2026-04-22', after: 'Cutover' }, // impossible
		{ phase: 'Rollback drill', from: '', to: '' } // unscheduled → lane, no bar
	];
</script>

<ContentPage
	title="Chart — Gantt (Spans & Dependencies)"
	subtitle="The one chart whose mark has a length: start, end, and what waits on what"
>
	<div class="demo">
		<figure class="viz">
			<Gantt
				data={plan}
				task="phase"
				start="from"
				end="to"
				progress="done"
				dependsOn="after"
				today="2026-04-01"
				xLabel="2026"
				height={420}
				animate
				title="Database migration plan"
				description="Eight rows from March to May 2026: the schema audit is complete, dual-write is 70% done, the runbook 40% and running in parallel with no dependency, the backfill 25%, shadow reads follow, a cutover milestone lands on April 20, dropping the old tables claims to wait for that cutover yet starts on April 15, and a rollback drill is unscheduled. Each solid arrow is a finish-to-start dependency; the dashed red one marks the contradiction; the dashed vertical rule marks April 1."
			/>
			<figcaption>
				Spans from real dates, finish-to-start <code>dependsOn</code> arrows by task name, a
				diamond for the dateless <code>Cutover</code> milestone, shaded <code>progress</code>, and
				the dashed <code>today</code> rule. “Write runbook” overlaps the chain with
				<em>no</em> dependency — that is how parallel work is shown. “Drop old tables” waits on the
				cutover yet starts before it, so its arrow is <strong>dashed red</strong>: the dates and the
				dependency disagree. “Rollback drill” has no dates — it keeps its lane, draws no bar.
			</figcaption>
		</figure>
	</div>

	<p class="aside">
		<strong>An arrow means finish-to-start</strong> — “cannot begin until that one ends”. It is the
		one link type here, so a dependent starting <em>before</em> its predecessor finishes is a
		contradiction, not a subtlety: real planners would call that a start-to-start link or a negative
		lag, and neither is modelled. Rather than draw an arrow running backwards through time as though
		it were ordinary, the chart dashes it in the warn colour and says so on hover.
	</p>
	<p class="aside">
		<strong>Not a <code>Timeline</code>.</strong> That component is a narrative event spine — evenly
		spaced markers with free-text labels and no date arithmetic, so an event has no length and two
		events three years apart sit as far apart as two three days apart. A Gantt puts real dates on a
		real axis, which is why overlap and duration are visible at all.
	</p>
</ContentPage>

<ViewSource {source} {path} />

<style>
	.demo {
		/* light "inverted panel" on the dark deck */
		--chart-fg: #1a2530;
		--chart-task: #2f6db0;
		--chart-task-done: #1c4270;
		--chart-milestone: #b25f00;
		--chart-link: rgba(30, 60, 90, 0.55);
		--chart-link-warn: #a8342f;
		--chart-today: #6b7c8c;
		--chart-grid: rgba(30, 60, 90, 0.14);
		--chart-axis: rgba(30, 60, 90, 0.5);
		--chart-font-size: 12px;
		--chart-tooltip-bg: #1a2530;
		--chart-tooltip-fg: #f4f7fa;

		display: flex;
		/* pin LTR so an inherited text direction can't flip the plan */
		direction: ltr;
		justify-content: center;
		margin: 0.3em auto 0;
		max-width: 1500px;
		text-align: initial;
	}
	.viz {
		flex: 1 1 auto;
		margin: 0;
		padding: 0.6em 0.9em 0.4em;
		background: #eef2f5;
		border: 1px solid #9fb0bc;
		border-radius: 10px;
	}
	.viz figcaption {
		margin-top: 0.2em;
		color: #33404b;
		font-size: 0.58em;
		line-height: 1.4;
		text-align: center;
	}
	.aside {
		max-width: 1200px;
		margin: 0.6em auto 0;
		font-size: 0.6em;
		line-height: 1.45;
		text-align: center;
		opacity: 0.9;
	}
</style>
