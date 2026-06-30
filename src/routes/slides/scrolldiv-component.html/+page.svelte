<!--
  Example: ScrollDiv component (also covers WideDiv = axis="x")
  File: src/routes/slides/scrolldiv-component.html/+page.svelte
-->
<script>
	import ContentPage from '$lib/templates/ContentPage.svelte';
	import ScrollDiv   from '$lib/components/ScrollDiv.svelte';
</script>

<ContentPage title="ScrollDiv" subtitle="Wheel-pannable container — axis: x / y / both (WideDiv = axis=&quot;x&quot;)">
	<p>Hover a panel and scroll the wheel. Drag the <b>scrollbar</b> too. Same component, different <code>axis</code>:</p>

	<div style="display: flex; gap: 1.5em; align-items: flex-start;">
		<!-- axis="x" — horizontal (this is WideDiv) -->
		<div>
			<p style="margin: 0 0 0.4em; font-weight: bold;">axis="x" <span style="font-weight: normal; opacity: 0.7;">(= WideDiv)</span></p>
			<ScrollDiv axis="x" outerWidth="520" outerHeight="320" innerWidth="1300" scrollbar
			           style="border-radius: 8px;">
				<div style="display: flex; gap: 1em; padding: 1em;">
					{#each Array.from({ length: 12 }) as _, i}
						<div style="min-width: 150px; height: 280px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; color: #000; background: hsl({i * 30}, 70%, 72%);">
							{i + 1}
						</div>
					{/each}
				</div>
			</ScrollDiv>
		</div>

		<!-- axis="y" — vertical pan -->
		<div>
			<p style="margin: 0 0 0.4em; font-weight: bold;">axis="y"</p>
			<ScrollDiv axis="y" outerWidth="300" outerHeight="320" innerHeight="1100" scrollbar
			           style="border-radius: 8px;">
				<div style="display: flex; flex-direction: column; gap: 1em; padding: 1em;">
					{#each Array.from({ length: 10 }) as _, i}
						<div style="height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; color: #000; background: hsl({i * 36}, 70%, 72%);">
							row {i + 1}
						</div>
					{/each}
				</div>
			</ScrollDiv>
		</div>

		<!-- axis="both" — deltaX pans X, deltaY pans Y; Shift+wheel = horizontal -->
		<div>
			<p style="margin: 0 0 0.4em; font-weight: bold;">axis="both" <span style="font-weight: normal; opacity: 0.7;">(Shift+wheel = horizontal)</span></p>
			<ScrollDiv axis="both" outerWidth="520" outerHeight="320"
			           innerWidth="1400" innerHeight="1000" scrollbar style="border-radius: 8px;">
				<div style="display: grid; grid-template-columns: repeat(7, 180px); gap: 1em; padding: 1em;">
					{#each Array.from({ length: 35 }) as _, i}
						<div style="height: 150px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: bold; color: #000; background: hsl({i * 18}, 65%, 70%);">
							{i + 1}
						</div>
					{/each}
				</div>
			</ScrollDiv>
		</div>
	</div>

	<p style="margin-top: 0.6em; opacity: 0.8;">
		Props: <code>axis</code> (<code>x</code>/<code>y</code>/<code>both</code>),
		<code>outerWidth</code>, <code>outerHeight</code>, <code>innerWidth</code>,
		<code>innerHeight</code> (pixels), <code>scrollbar</code>, <code>scrollable</code>.
	</p>
</ContentPage>
