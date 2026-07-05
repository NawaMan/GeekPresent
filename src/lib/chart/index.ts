// Public exports for the chart module.
//
// Charts consume plain T[] arrays + accessors and never import from
// $lib/datatable — the only contract is "plain arrays + accessors + pure
// pipeline", so a chart can sit downstream of a table's bind:state with no
// coupling. All geometry/data math lives in the pure chartCore.ts; components
// (BarChart, LineChart, Axis) land alongside these exports as they arrive.
export { default as Axis } from './Axis.svelte';
export { default as BarChart } from './BarChart.svelte';
export { default as LineChart } from './LineChart.svelte';
export * from './chartCore';
export type * from './types';
