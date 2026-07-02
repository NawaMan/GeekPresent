// Public exports for the Draw module (specs/DRAW-1.md).
//
// Shapes compose as markup inside <Draw> — one component per shape, each
// rendering bare SVG elements in canvas coordinates, so a shape's tag on the
// slide diffs line-by-line and Phase 3's per-shape Copy has a tag to copy.
// Raw SVG elements pass through <Draw>'s slot as an escape hatch.
export { default as Arc } from './Arc.svelte';
export { default as Curve } from './Curve.svelte';
export { default as Draw } from './Draw.svelte';
export { default as Line } from './Line.svelte';
export { default as Polyline } from './Polyline.svelte';
export { default as Rect } from './Rect.svelte';
export { default as Ellipse } from './Ellipse.svelte';
export * from './drawCore';
export * from './types';
