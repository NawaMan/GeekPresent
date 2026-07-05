import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import BarChart from '../src/lib/chart/BarChart.svelte';
import LineChart from '../src/lib/chart/LineChart.svelte';
import type { AxisDef, SeriesDef } from '../src/lib/chart/types';

// Structure-only smoke tests (no pixels): bar/rect counts, gap in the line
// path, tick labels, zero-line presence. The pure geometry is covered
// exhaustively in chartCore.test.ts; these prove the components wire it up.

type Region = { region: string; net: number | null };
const regions: Region[] = [
	{ region: 'us-east', net: 320 },
	{ region: 'us-west', net: -140 }, // negative → below the zero line
	{ region: 'eu-west', net: null }, // blank → no bar
	{ region: 'sa-east', net: 480 }
];
// AxisDef/SeriesDef<any> — testing-library's render() can't infer the generic.
const regionX: AxisDef = { value: 'region', type: 'band' };
const netSeries: SeriesDef = { key: 'net', label: 'Net change', value: 'net' };

type Sample = { month: number; latency: number | null };
const samples: Sample[] = [
	{ month: 1, latency: 120 },
	{ month: 4, latency: 128 }, // uneven x
	{ month: 5, latency: null }, // blank → gap
	{ month: 6, latency: 145 }
];
const monthX: AxisDef = { value: 'month', type: 'linear', label: 'Month' };
const latencySeries: SeriesDef = { key: 'latency', label: 'Latency', value: 'latency' };

describe('BarChart', () => {
	it('draws one bar per non-blank row (the blank draws none)', () => {
		const { container } = render(BarChart, {
			props: { data: regions, x: regionX, series: netSeries, title: 'Net by region' }
		});
		const bars = container.querySelectorAll('.bars rect');
		expect(bars).toHaveLength(3); // eu-west (null) omitted
	});

	it('is an accessible image with a title and per-bar aria-labels', () => {
		const { container } = render(BarChart, {
			props: {
				data: regions,
				x: regionX,
				series: netSeries,
				title: 'Net by region',
				description: 'net change per region'
			}
		});
		const svg = container.querySelector('svg')!;
		expect(svg.getAttribute('role')).toBe('img');
		expect(container.querySelector('title')?.textContent).toBe('Net by region');
		expect(container.querySelector('desc')?.textContent).toBe('net change per region');
		const labels = Array.from(container.querySelectorAll('.bars rect')).map((r) =>
			r.getAttribute('aria-label')
		);
		expect(labels).toContain('us-east: 320');
		expect(labels).toContain('us-west: -140');
	});

	it('renders a zero baseline and includes 0 among the y ticks', () => {
		const { container } = render(BarChart, {
			props: { data: regions, x: regionX, series: netSeries, title: 'Net by region' }
		});
		expect(container.querySelector('.zero-line')).not.toBeNull();
		const tickTexts = Array.from(container.querySelectorAll('.ticks .tick-label')).map(
			(t) => t.textContent
		);
		expect(tickTexts).toContain('0');
	});

	it('forces zero into the domain even when all values are positive', () => {
		const { container } = render(BarChart, {
			props: {
				data: [{ region: 'a', net: 500 }, { region: 'b', net: 900 }],
				x: regionX,
				series: netSeries,
				title: 'All positive'
			}
		});
		const tickTexts = Array.from(container.querySelectorAll('.ticks .tick-label')).map(
			(t) => t.textContent
		);
		expect(tickTexts).toContain('0');
	});
});

describe('LineChart', () => {
	it('breaks the line into two sub-paths across a blank (a gap, not a dip to 0)', () => {
		const { container } = render(LineChart, {
			props: { data: samples, x: monthX, series: latencySeries, title: 'Latency' }
		});
		const d = container.querySelector('path.line')!.getAttribute('d')!;
		expect(d.match(/M/g)).toHaveLength(2); // two moves = one gap
		expect(d).not.toContain('L 0'); // never routes through y=0
	});

	it('draws a dot only at each finite point when points is set', () => {
		const { container } = render(LineChart, {
			props: { data: samples, x: monthX, series: latencySeries, title: 'Latency', points: true }
		});
		// 4 samples, one is blank → 3 finite dots
		expect(container.querySelectorAll('.dots circle')).toHaveLength(3);
	});

	it('renders the x-axis label', () => {
		const { container } = render(LineChart, {
			props: { data: samples, x: monthX, series: latencySeries, title: 'Latency' }
		});
		const labels = Array.from(container.querySelectorAll('.axis-label')).map((t) => t.textContent);
		expect(labels).toContain('Month');
	});
});
