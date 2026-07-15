// DOM tests for the top toolbar: it owns the ANNOTATE pen toggle (lifted here from <Annotate>
// so it out-ranks the armed ink surface — the overlay it lives in sits above the surface) and
// folds in the DISPLAY zoom control. The pen's DRAWING behaviour is still tested in
// Annotate.test.ts; this file covers only what the toolbar itself is responsible for.
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import SlideToolbarHost from './SlideToolbarHost.svelte';
import { annotationMode, canAnnotate, resetAllInk } from '../src/lib/stores/annotation';

beforeEach(() => {
	localStorage.clear();
	resetAllInk();
	canAnnotate.set(true);
	annotationMode.set(false);
});

afterEach(cleanup);

describe('SlideToolbar', () => {
	it('arms and disarms the pen from the ANNOTATE toggle', async () => {
		render(SlideToolbarHost);

		// The bug this guards: the toggle used to sit UNDER the ink surface, which owns every
		// pointer while armed — so a speaker could arm the pen and never disarm it. It now lives
		// in the window-fixed overlay, above the surface; its aria-label carries the on/off state.
		const off = screen.getByLabelText('ANNOTATE off');
		await fireEvent.click(off);
		expect(get(annotationMode)).toBe(true);

		await fireEvent.click(screen.getByLabelText('ANNOTATE on'));
		expect(get(annotationMode)).toBe(false);
	});

	it('shows the ANNOTATE toggle DISABLED on a deck that never offered the pen', () => {
		canAnnotate.set(false);
		render(SlideToolbarHost);

		const toggle = screen.getByLabelText('ANNOTATE off') as HTMLButtonElement;
		expect(toggle.disabled).toBe(true);
	});

	it('folds in the DISPLAY zoom control', () => {
		render(SlideToolbarHost);

		// The <SizeMode> renders in its inline (in-row) form, not its standalone corner form.
		const display = document.querySelector('.mode.inline');
		expect(display).toBeTruthy();
		// FITTED is the default label (no persisted mode in a cleared localStorage).
		expect(display?.textContent).toContain('FITTED');
	});
});
