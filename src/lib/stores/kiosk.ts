/*
  Kiosk session state — offered vs running, paces, pause, notes-for-timing.

  Offered (canKiosk) follows the same sticky-URL pattern as ANNOTATE / CAPTURE.
  Running is a *session* preference: OK in the dialog or `?kiosk` starts it and
  survives full-page slide loads (`kioskWantsRun`); Stop / `?kiosk=off` clears it.
  Paces and the notes toggle are remembered across reloads so a booth keeps its
  tuning; they do not cross-tab-sync (a second tab editing paces should not yank
  the lobby screen mid-loop — same bargain as displayMode).
*/

import { derived, get, writable, type Readable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { persisted } from '$lib/stores/persisted';
import { booleanCodec, jsonCodec } from '$lib/utils/stateCore';
import {
	DEFAULT_PAGE_MS,
	DEFAULT_STEP_MS,
	clampPaceMs,
	readKioskParam,
	readSticky,
	resolveCanKiosk,
	type Choice
} from '$lib/kiosk/kioskCore';

export type KioskStatus = 'off' | 'running' | 'paused';

/** Is the Kiosk menu offered? (Not the same as running.) */
export const canKiosk: Writable<boolean> = writable(false);

/** Live status for the indicator and runner. */
export const kioskStatus: Writable<KioskStatus> = writable('off');

/** True while status is running or paused — notes may mount for measurement. */
export const kioskActive: Readable<boolean> = derived(
	kioskStatus,
	($s) => $s === 'running' || $s === 'paused'
);

/** Survives full-page nav so a non-ViewTransition deck keeps auto-advancing. */
export const kioskWantsRun = persisted('geekpresent:kiosk:wantsRun', false, {
	codec: booleanCodec(),
	sync: false
});

export interface KioskPaces {
	stepMs: number;
	pageMs: number;
	useNotes: boolean;
}

const defaultPaces = (): KioskPaces => ({
	stepMs: DEFAULT_STEP_MS,
	pageMs: DEFAULT_PAGE_MS,
	useNotes: false
});

/** Session overrides for paces / notes. `null` fields mean "use deck prop". */
export interface KioskPaceOverride {
	stepMs?: number;
	pageMs?: number;
	useNotes?: boolean;
}

export const kioskPaceOverride = persisted<KioskPaceOverride>(
	'geekpresent:kiosk:paces',
	{},
	{ codec: jsonCodec<KioskPaceOverride>(), sync: false }
);

/** Dialog open (setup / reconfigure). */
export const kioskDialogOpen: Writable<boolean> = writable(false);

/** Deck defaults pushed from SlideDeck props each render. */
export const kioskDeckDefaults: Writable<KioskPaces> = writable(defaultPaces());

/** Effective paces: override wins when set, else deck default. */
export const kioskPaces: Readable<KioskPaces> = derived(
	[kioskPaceOverride, kioskDeckDefaults],
	([$o, $d]) => ({
		stepMs: clampPaceMs($o.stepMs ?? $d.stepMs, $d.stepMs),
		pageMs: clampPaceMs($o.pageMs ?? $d.pageMs, $d.pageMs),
		useNotes: typeof $o.useNotes === 'boolean' ? $o.useNotes : $d.useNotes
	})
);

/** Indicator: fraction 0..1 of the current dwell (runner updates). */
export const kioskDwellFraction: Writable<number> = writable(0);

/** Indicator label: 'step' | 'page' | 'wait' | '' */
export const kioskPhaseLabel: Writable<string> = writable('');

/** Live speaker-note text for the kiosk caption (Note publishes; caption reads). */
export const kioskNoteText: Writable<string> = writable('');

export function setCanKiosk(offered: boolean): void {
	canKiosk.set(!!offered);
}

/** Persist sticky offer from `?kiosk` / `?kiosk=off`. Does NOT start/stop —
    call `bootKioskFromUrl` once on mount for that (avoids a Stop being undone by
    a reactive re-apply while the URL still says `?kiosk`). */
export function applyKioskParam(url: URL): void {
	if (!browser) return;
	const choice = readKioskParam(url.searchParams);
	if (choice !== null) {
		try {
			localStorage.setItem('canKiosk', String(choice));
		} catch {
			/* private mode */
		}
	}
}

/**
 * One-shot boot: `?kiosk` starts, `?kiosk=off` stops, absent restores a session
 * that still wants to run (full-page nav mid-loop).
 */
export function bootKioskFromUrl(url: URL): void {
	if (!browser) return;
	const choice = readKioskParam(url.searchParams);
	applyKioskParam(url);
	if (choice === true) startKiosk();
	else if (choice === false) stopKiosk();
	else restoreKioskIfWanted();
}

export function resolveOffered(dev: boolean, deckWide: boolean): boolean {
	if (!browser) return dev || deckWide;
	let sticky = readSticky(localStorage.getItem('canKiosk'));
	// Live URL flag also counts as an offer for this page (before sticky is written).
	const live = readKioskParam(
		typeof window !== 'undefined' ? new URL(window.location.href).searchParams : null
	);
	if (live !== null) sticky = live;
	return resolveCanKiosk(dev, sticky, deckWide);
}

export function openKioskDialog(): void {
	kioskDialogOpen.set(true);
}

export function closeKioskDialog(): void {
	kioskDialogOpen.set(false);
}

/** Commit dialog paces and start (or resume) running. */
export function confirmKiosk(paces: KioskPaces): void {
	kioskPaceOverride.set({
		stepMs: clampPaceMs(paces.stepMs, DEFAULT_STEP_MS),
		pageMs: clampPaceMs(paces.pageMs, DEFAULT_PAGE_MS),
		useNotes: !!paces.useNotes
	});
	startKiosk();
	kioskDialogOpen.set(false);
}

export function startKiosk(): void {
	kioskWantsRun.set(true);
	kioskStatus.set('running');
	kioskDwellFraction.set(0);
}

export function pauseKiosk(): void {
	if (get(kioskStatus) === 'running') kioskStatus.set('paused');
}

export function resumeKiosk(): void {
	if (get(kioskStatus) === 'paused') kioskStatus.set('running');
}

export function toggleKioskPause(): void {
	const s = get(kioskStatus);
	if (s === 'running') kioskStatus.set('paused');
	else if (s === 'paused') kioskStatus.set('running');
}

export function stopKiosk(): void {
	kioskWantsRun.set(false);
	kioskStatus.set('off');
	kioskDwellFraction.set(0);
	kioskPhaseLabel.set('');
	kioskDialogOpen.set(false);
}

/** After a full page load: resume if the session still wants to run. */
export function restoreKioskIfWanted(): void {
	if (!browser) return;
	if (get(kioskWantsRun) && get(kioskStatus) === 'off') {
		kioskStatus.set('running');
	}
}
