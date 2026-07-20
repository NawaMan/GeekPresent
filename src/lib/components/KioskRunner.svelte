<!--
  KioskRunner — the auto-advance clock.

  While status is `running`, ticks every frame-ish interval and:

    1. Waits for finite CSS animations on the slide content to finish.
    2. Reveals the next build step (activeSteps.next — Space semantics).
    3. After the build is spent, dwells (page pace, optionally max'd with
       speaker-note reading time), then pages — looping to the first visible
       slide at the end of the deck.

  Pause freezes the dwell timer. Stop unmounts the effect via status `off`.
  Navigation goes through deckNav so View-Transition decks animate.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import type { Page } from '$lib/utils/navigate';
	import { visiblePages } from '$lib/utils/navigate';
	import { navigate } from '$lib/utils/deckNav';
	import { getViewTransitions } from '$lib/presentation';
	import { activeSteps } from '$lib/stores/activeSteps';
	import { collectFinite, sampleFraction } from '$lib/utils/slideAnim';
	import {
		kioskStatus,
		kioskPaces,
		kioskDwellFraction,
		kioskPhaseLabel
	} from '$lib/stores/kiosk';
	import {
		dwellProgress,
		kioskAction,
		noteTextFrom,
		pageDwellMs
	} from '$lib/kiosk/kioskCore';
	import { kioskNoteText } from '$lib/stores/kiosk';

	/** Linear slide list (hidden appendices excluded by visiblePages when paging). */
	export let pages: Page[] = [];
	/** Current slide file name (e.g. title.html). */
	export let currentSlide: string = '';
	/** Relative prefix for nav hrefs (usually './'). */
	export let prefix: string = './';
	/** Words-per-minute for note-based page dwell. */
	export let wpm: number = 150;

	const viewTransitions = getViewTransitions();

	let timer: ReturnType<typeof setInterval> | null = null;
	let dwellStartedAt = 0;
	let dwellTotal = 0;
	/** Elapsed ms frozen at pause so resume does not skip ahead. */
	let pausedElapsed = 0;
	let lastAction: string = '';
	let lastSlide = '';

	function contentRoot(): Element | null {
		return document.querySelector('.content');
	}

	function animBusy(): boolean {
		const root = contentRoot();
		if (!root) return false;
		const anims = collectFinite(root);
		if (!anims.length) return false;
		return sampleFraction(anims) < 0.999;
	}

	function targetForPage(): string | null {
		const deck = visiblePages(pages);
		if (!deck.length) return null;
		const idx = deck.findIndex((p) => p.path === currentSlide);
		if (idx < 0) return prefix + deck[0].path;
		if (idx < deck.length - 1) return prefix + deck[idx + 1].path;
		// Loop
		return prefix + deck[0].path;
	}

	function resetDwell(totalMs: number, phase: string) {
		dwellStartedAt = performance.now();
		dwellTotal = totalMs;
		pausedElapsed = 0;
		lastAction = phase;
		kioskPhaseLabel.set(phase);
		kioskDwellFraction.set(0);
	}

	function tick() {
		if (get(kioskStatus) !== 'running') return;

		// New slide → restart dwell accounting
		if (currentSlide !== lastSlide) {
			lastSlide = currentSlide;
			lastAction = '';
			dwellStartedAt = 0;
			dwellTotal = 0;
			pausedElapsed = 0;
			kioskDwellFraction.set(0);
		}

		const steps = get(activeSteps);
		const action = kioskAction({
			animBusy: animBusy(),
			hasNextStep: !!steps?.hasNext
		});
		const paces = get(kioskPaces);

		if (action === 'wait') {
			if (lastAction !== 'wait') resetDwell(0, 'wait');
			kioskDwellFraction.set(0);
			return;
		}

		const needMs =
			action === 'reveal'
				? paces.stepMs
				: pageDwellMs({
						pageMs: paces.pageMs,
						useNotes: paces.useNotes,
						// Prefer the store Note publishes (works even when the source node is clipped)
						noteText: get(kioskNoteText) || noteTextFrom(contentRoot()),
						wpm
					});

		if (lastAction !== action || dwellTotal !== needMs) {
			resetDwell(needMs, action);
		}

		const elapsed = performance.now() - dwellStartedAt;
		kioskDwellFraction.set(dwellProgress(elapsed, dwellTotal));

		if (elapsed < dwellTotal) return;

		// Act once, then reset so we don't double-fire in the same tick window.
		if (action === 'reveal') {
			const s = get(activeSteps);
			if (s?.hasNext) s.next();
			resetDwell(paces.stepMs, 'reveal');
			return;
		}

		// page
		const href = targetForPage();
		if (!href) {
			resetDwell(needMs, 'page');
			return;
		}
		const leaving = pages.find((p) => p.path === currentSlide);
		const kind = leaving?.transition ?? 'slide';
		// Prevent re-entry before navigation tears us down
		resetDwell(needMs, 'page');
		navigate(href, { viewTransitions, kind, direction: 'forward' });
	}

	function stopTimer() {
		if (timer != null) {
			clearInterval(timer);
			timer = null;
		}
	}

	function syncTimer(status: string) {
		if (!browser) return;
		if (status === 'running') {
			if (timer == null) {
				if (pausedElapsed > 0 && dwellTotal > 0) {
					dwellStartedAt = performance.now() - pausedElapsed;
					pausedElapsed = 0;
				} else if (!dwellStartedAt) {
					dwellStartedAt = performance.now();
				}
				timer = setInterval(tick, 100);
				tick();
			}
		} else if (status === 'paused') {
			if (timer != null && dwellStartedAt) {
				pausedElapsed = Math.max(0, performance.now() - dwellStartedAt);
			}
			stopTimer();
		} else {
			stopTimer();
			dwellStartedAt = 0;
			dwellTotal = 0;
			pausedElapsed = 0;
			lastAction = '';
			lastSlide = '';
		}
	}

	$: if (browser) syncTimer($kioskStatus);

	// Re-evaluate when the slide identity changes while running
	$: if (browser && $kioskStatus === 'running' && currentSlide) {
		/* reactive dependency on currentSlide — tick handles the reset */
		void currentSlide;
	}

	onDestroy(stopTimer);
</script>
