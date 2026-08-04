<!--
  Flow diagram: linear deck march vs appendix detour.
  Colocated with the Slide Pages appendix reference slides.
-->
<script lang="ts">
	/** Compact for tight columns, or roomy for a full side panel. */
	export let compact = false;
</script>

<svg
	class="flow"
	class:compact
	viewBox="0 0 400 290"
	role="img"
	aria-label="Regular deck flow is a straight chain of slides. Appendix flow detours down to a short chain and returns."
>
	<defs>
		<marker id="arr-reg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
			<path d="M 0 1 L 9 5 L 0 9 z" fill="#8fd4ff" />
		</marker>
		<marker id="arr-det" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
			<path d="M 0 1 L 9 5 L 0 9 z" fill="#c9a0ff" />
		</marker>
	</defs>

	<!-- ── Regular ─────────────────────────────────────────── -->
	<text x="8" y="26" class="label">Regular</text>
	<text x="8" y="46" class="sub">linear march · TOC · → / Space</text>

	{#each [36, 120, 204, 288] as x, i}
		<circle cx={x} cy="88" r="17" class="node" />
		<text x={x} y="93" class="num" text-anchor="middle">{i + 1}</text>
		{#if i < 3}
			<line
				x1={x + 20}
				y1="88"
				x2={x + 84 - 20}
				y2="88"
				class="edge"
				marker-end="url(#arr-reg)"
			/>
		{/if}
	{/each}
	<line x1="308" y1="88" x2="360" y2="88" class="edge" marker-end="url(#arr-reg)" />

	<!-- ── Appendix ────────────────────────────────────────── -->
	<text x="8" y="148" class="label">Appendix</text>
	<text x="8" y="168" class="sub">call down · page through · return up</text>

	{#each [36, 120, 204, 288] as x, i}
		<circle cx={x} cy="210" r="17" class="node" class:caller={i === 1} />
		<text x={x} y="215" class="num" text-anchor="middle">{i + 1}</text>
		{#if i < 3}
			<line
				x1={x + 20}
				y1="210"
				x2={x + 84 - 20}
				y2="210"
				class="edge"
				marker-end="url(#arr-reg)"
			/>
		{/if}
	{/each}
	<line x1="308" y1="210" x2="360" y2="210" class="edge" marker-end="url(#arr-reg)" />

	<!-- Detour under caller (node 2 at x=120): down → A → B → up back -->
	<!-- down -->
	<line x1="120" y1="227" x2="120" y2="248" class="detour" marker-end="url(#arr-det)" />
	<!-- A -->
	<circle cx="120" cy="266" r="15" class="node appendix" />
	<text x="120" y="271" class="num" text-anchor="middle">A</text>
	<!-- A → B -->
	<line x1="137" y1="266" x2="185" y2="266" class="detour" marker-end="url(#arr-det)" />
	<!-- B -->
	<circle cx="204" cy="266" r="15" class="node appendix" />
	<text x="204" y="271" class="num" text-anchor="middle">B</text>
	<!-- B up then left into caller (dashed return) -->
	<path
		d="M 204 251 L 204 236 L 136 236 L 136 227"
		class="detour return"
		fill="none"
		marker-end="url(#arr-det)"
	/>

	<text x="232" y="270" class="tag">hidden</text>
</svg>

<style>
	.flow {
		display: block;
		width: 100%;
		height: auto;
		max-height: 340px;
		color: #8fd4ff;
	}
	.flow.compact {
		max-height: 280px;
	}
	.label {
		fill: var(--page-title-fg, #f0a33e);
		font-size: 18px;
		font-weight: 700;
		font-family: system-ui, sans-serif;
	}
	.sub {
		fill: #c0f1ff;
		opacity: 0.6;
		font-size: 12px;
		font-family: system-ui, sans-serif;
	}
	.node {
		fill: #1a242c;
		stroke: #8fd4ff;
		stroke-width: 2.5;
	}
	.node.caller {
		stroke: var(--page-title-fg, #f0a33e);
		stroke-width: 3;
	}
	.node.appendix {
		stroke: #c9a0ff;
		fill: #221a2c;
	}
	.num {
		fill: #e8f6ff;
		font-size: 14px;
		font-weight: 600;
		font-family: system-ui, sans-serif;
		pointer-events: none;
	}
	.edge {
		stroke: #8fd4ff;
		stroke-width: 2.2;
		fill: none;
		opacity: 0.95;
	}
	.detour {
		stroke: #c9a0ff;
		stroke-width: 2.2;
		fill: none;
		opacity: 0.95;
	}
	.detour.return {
		stroke-dasharray: 5 4;
	}
	.tag {
		fill: #c9a0ff;
		font-size: 13px;
		font-family: system-ui, sans-serif;
		opacity: 0.9;
	}
</style>
