import { render, cleanup, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import KioskIndicator from '$lib/components/KioskIndicator.svelte';
import {
	kioskStatus,
	startKiosk,
	stopKiosk,
	pauseKiosk,
	kioskDialogOpen
} from '$lib/stores/kiosk';

describe('KioskIndicator', () => {
	beforeEach(() => {
		stopKiosk();
		kioskDialogOpen.set(false);
	});

	afterEach(() => {
		cleanup();
		stopKiosk();
	});

	it('is hidden when kiosk is off', () => {
		const { container } = render(KioskIndicator);
		expect(container.querySelector('.kiosk-ind')).toBeNull();
	});

	it('shows while running and can pause / stop', async () => {
		startKiosk();
		const { container, getByLabelText } = render(KioskIndicator);
		expect(container.querySelector('.kiosk-ind')).not.toBeNull();

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
});
