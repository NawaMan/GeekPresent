// @vitest-environment node
//
// Server-side render of the progress-demo slide (svelte/server, no DOM). It renders the
// REAL slide page, not a stand-in, so it proves the slide builds and that its live readout
// is wired to getProgress() — the position, the total and the percent all come out of the
// same store, so they must agree. The stub puts us on the last of three visible slides.
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Host from './ProgressDemoSsrHost.svelte';

describe('progress-demo slide (SSR)', () => {
	it('renders the real slide without a window in sight', () => {
		expect(typeof window).toBe('undefined');
		expect(() => render(Host, { props: {} })).not.toThrow();
	});

	const { body } = render(Host, { props: {} });

	it('shows the live position over the visible total, and the matching percent', () => {
		// stub.html is the 3rd of 3 visible slides — 3 / 3, 100%.
		expect(body).toContain('class="pos svelte');
		expect(body).toContain('>3<'); // position and total both render 3
		expect(body).toContain('100% through the deck');
		// the real ProgressBar rode along and agrees with the readout
		expect(body).toContain('aria-label="Slide 3 of 3"');
	});

	it('names the neighbours — the previous slide beside it, and none after the last', () => {
		// On the last slide (3/3) there is a prev ("B") but no next.
		expect(body).toContain('data-testid="prev"');
		expect(body).toContain('>B<');
		expect(body).not.toContain('data-testid="next"');
	});
});
