import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import KioskIndicator from '$lib/components/KioskIndicator.svelte';
import {
	kioskStatus,
	startKiosk,
	stopKiosk,
	kioskDialogOpen,
	kioskPaceOverride,
	setKioskNoteItems,
	kioskNoteIndex,
	advanceKioskNote,
	clearKioskNotes
} from '$lib/stores/kiosk';

describe('KioskIndicator — combined transport + notes panel', () => {
	beforeEach(() => {
		stopKiosk();
		kioskDialogOpen.set(false);
		kioskPaceOverride.set({});
		clearKioskNotes();
	});

	afterEach(() => {
		cleanup();
		stopKiosk();
		clearKioskNotes();
		kioskPaceOverride.set({});
	});

	it('is hidden when kiosk is off', () => {
		const { container } = render(KioskIndicator);
		expect(container.querySelector('.kiosk-panel')).toBeNull();
	});

	it('shows a compact bar while running (no notes) and can pause / stop', async () => {
		startKiosk();
		const { container, getByLabelText } = render(KioskIndicator);
		const panel = container.querySelector('.kiosk-panel');
		expect(panel).not.toBeNull();
		expect(panel?.classList.contains('has-note')).toBe(false);
		expect(container.querySelector('.kiosk-note-body')).toBeNull();

		await fireEvent.click(getByLabelText('Pause'));
		expect(get(kioskStatus)).toBe('paused');

		await fireEvent.click(getByLabelText('Resume'));
		expect(get(kioskStatus)).toBe('running');

		await fireEvent.click(getByLabelText('Stop kiosk'));
		expect(get(kioskStatus)).toBe('off');
	});

	it('settings opens the dialog', async () => {
		startKiosk();
		const { getByLabelText } = render(KioskIndicator);
		await fireEvent.click(getByLabelText('Kiosk settings'));
		expect(get(kioskDialogOpen)).toBe(true);
	});

	it('folds the current note line into the same panel with n/N progress', async () => {
		kioskPaceOverride.set({ useNotes: true });
		startKiosk();
		setKioskNoteItems(['First bullet', 'Second bullet', 'Third']);
		const { container, findByText } = render(KioskIndicator);

		const panel = container.querySelector('.kiosk-panel');
		expect(panel?.classList.contains('has-note')).toBe(true);
		expect(container.querySelector('.kiosk-note-body')?.textContent?.trim()).toBe('First bullet');
		expect(container.querySelector('.note-count')?.textContent?.trim()).toBe('1 / 3');

		// Advance as the runner would — body and count track the index.
		expect(advanceKioskNote()).toBe(true);
		expect(get(kioskNoteIndex)).toBe(1);
		// Svelte store update → re-render
		await findByText('Second bullet');
		expect(container.querySelector('.note-count')?.textContent?.trim()).toBe('2 / 3');
	});
});
