<!--
  WideDiv — horizontally pannable container. Thin back-compat alias for
  <ScrollDiv axis="x">; its props map straight through. Reach for ScrollDiv
  directly when you want vertical ("y") or two-axis ("both") panning.
-->
<script lang="ts">
	import ScrollDiv from './ScrollDiv.svelte';

	export let outerWidth: string;
	export let innerWidth: string;
	export let height:     string;
	export let scrollable: boolean = true;
	export let startScrollPosition: number           = 0;
	export let minScrollPosition:   number|undefined = undefined;
	export let maxScrollPosition:   number|undefined = undefined;
	export let onScroll:            (target: EventTarget | null, position: number) => void = () => {};
</script>

<ScrollDiv
	axis="x"
	{outerWidth}
	outerHeight={height}
	{innerWidth}
	innerHeight={height}
	{scrollable}
	startX={startScrollPosition}
	minX={minScrollPosition}
	maxX={maxScrollPosition}
	onScroll={(target, pos) => onScroll(target, pos.x)}
	{...$$restProps}
>
	<slot></slot>
</ScrollDiv>
