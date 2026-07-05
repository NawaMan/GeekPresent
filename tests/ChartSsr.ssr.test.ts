// @vitest-environment node
//
// True server-side render of the charts (svelte/server, no DOM): the node
// environment gets vitest's SSR transform, so the components compile in server
// mode — proving each chart emits its complete SVG markup from props alone,
// which is what prerendering a slide does. (The slides deck itself gates slide
// content behind onMount in SlideDeck, so the deck's built HTML can't
// demonstrate this — this test is the prerender guarantee, mirroring
// DrawSsr.ssr.test.ts.)
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ChartSsrHost from './ChartSsrHost.svelte';

describe('Chart (SSR)', () => {
	const { body } = render(ChartSsrHost, { props: {} });

	it('renders the full BarChart SVG server-side from props alone', () => {
		expect(body).toContain('viewBox="0 0 640 400"');
		expect(body).toContain('role="img"');
		expect(body).toContain('<title>Net change by region</title>');
		expect(body).toContain('<desc>bars with a zero baseline</desc>');
		// three region bars: us-east, us-west, sa-east — eu-west is blank, no rect
		// (single-series labels are "cat: value"; the ComboChart below uses "cat — series: value")
		const regionBars = body.match(/aria-label="[^"—]*: -?[\d,]+"/g) ?? [];
		expect(regionBars).toHaveLength(3);
		expect(body).toContain('aria-label="us-east: 320"');
		expect(body).toContain('aria-label="us-west: -140"'); // negative bar
		expect(body).not.toContain('eu-west:'); // blank drew no bar
		expect(body).toContain('zero-line'); // visible zero baseline (scoped class)
	});

	it('renders the LineChart line as a gapped path (blank → two sub-paths)', () => {
		expect(body).toContain('<title>Latency over time</title>');
		const line = body.match(/class="line[^"]*"[^>]*d="([^"]*)"/)?.[1] ?? '';
		expect(line).not.toBe('');
		// the null at month 5 breaks the line: exactly two M sub-paths, a gap
		expect(line.match(/M/g)).toHaveLength(2);
		expect(body).toContain('<circle'); // point dots
	});

	it('renders the ComboChart bars and line server-side on two axes', () => {
		expect(body).toContain('<title>Sessions and rate</title>');
		// bar rects for the sessions series…
		expect(body).toContain('aria-label="Jan — Sessions: 4,200"');
		// …and a line path for the rate series
		expect(body).toMatch(/class="line[^"]*"[^>]*d="M /);
	});

	it('renders the PieChart (donut) slices server-side with value + percentage labels', () => {
		expect(body).toContain('<title>Request share by region</title>');
		// 60/30/10 shares → per-slice aria-labels with value and percentage
		expect(body).toContain('aria-label="apac: 60 (60%)"');
		expect(body).toContain('aria-label="latam: 10 (10%)"');
		// donut (innerRadius set) → ring-segment paths carry an inner arc (two A cmds)
		const slice = body.match(/class="slice[^"]*"[^>]*d="([^"]*)"/)?.[1] ?? '';
		expect((slice.match(/A /g) ?? []).length).toBe(2);
	});

	it('never emits NaN in any coordinate', () => {
		expect(body).not.toContain('NaN');
	});

	it('never prerenders the pointer-only layers (tooltip / hover guide)', () => {
		// The interactive layer mounts client-side; the static SVG must be complete
		// on its own, with no tooltip panel or hover guide in the server output.
		expect(body).not.toContain('class="tooltip"');
		expect(body).not.toContain('class="guide"');
	});
});
