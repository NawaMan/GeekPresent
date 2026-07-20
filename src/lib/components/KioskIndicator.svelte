<!--
  Kiosk indicator — small corner chip: progress ring + pause/resume + stop.

  Visible while kiosk is running or paused; sits bottom-left at high opacity so
  Pause/Stop stay obvious on a booth screen. Explicit controls only — keys and
  pointer elsewhere do not exit kiosk.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import {
		kioskStatus,
		kioskDwellFraction,
		kioskPhaseLabel,
		toggleKioskPause,
		stopKiosk,
		openKioskDialog
	} from '$lib/stores/kiosk';

	// SVG ring geometry
	const R = 10;
	const C = 2 * Math.PI * R;
	$: frac = Math.max(0, Math.min(1, $kioskDwellFraction || 0));
	$: dash = `${frac * C} ${C}`;
	$: paused = $kioskStatus === 'paused';
	$: phase = $kioskPhaseLabel || (paused ? 'paused' : 'kiosk');
</script>

{#if browser && $kioskStatus !== 'off'}
	<div
		class="kiosk-ind no-print gp-chrome"
		class:paused
		role="status"
		aria-live="polite"
		aria-label={paused ? 'Kiosk paused' : `Kiosk running (${phase})`}
	>
		<button
			type="button"
			class="ring-btn"
			title={paused ? 'Resume kiosk' : 'Pause kiosk'}
			aria-label={paused ? 'Resume' : 'Pause'}
			on:click={toggleKioskPause}
		>
			<svg class="ring" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
				<circle class="track" cx="14" cy="14" r={R} fill="none" stroke-width="2.5" />
				<circle
					class="prog"
					cx="14"
					cy="14"
					r={R}
					fill="none"
					stroke-width="2.5"
					stroke-dasharray={dash}
					stroke-linecap="round"
					transform="rotate(-90 14 14)"
				/>
			</svg>
			<span class="glyph" aria-hidden="true">{paused ? '▶' : '❚❚'}</span>
		</button>

		<span class="meta">
			<span class="tag">KIOSK</span>
			<span class="phase">{phase}</span>
		</span>

		<button
			type="button"
			class="icon-btn"
			title="Kiosk settings"
			aria-label="Kiosk settings"
			on:click={() => openKioskDialog()}
		>⚙</button>

		<button
			type="button"
			class="icon-btn stop"
			title="Stop kiosk"
			aria-label="Stop kiosk"
			on:click={stopKiosk}
		>■</button>
	</div>
{/if}

<style>
	.kiosk-ind {
		position: fixed;
		left: 12px;
		right: auto;
		bottom: 12px;
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.45rem 0.3rem 0.3rem;
		border-radius: 999px;
		border: 1px solid var(--kiosk-edge, rgba(255, 255, 255, 0.28));
		background: var(--kiosk-panel-bg, rgba(20, 22, 26, 0.96));
		color: var(--kiosk-fg, #d7dde5);
		font-size: 11px;
		letter-spacing: 0.04em;
		/* Readable at rest — only a light dip so it does not vanish on a dark slide. */
		opacity: var(--kiosk-idle, 0.6);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
		transition: opacity 160ms ease;
		pointer-events: auto;
	}

	.kiosk-ind:hover,
	.kiosk-ind:focus-within {
		opacity: 1;
	}

	.kiosk-ind.paused {
		opacity: 1;
		border-color: var(--kiosk-accent, #3fa9f5);
	}

	.ring-btn {
		position: relative;
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.ring .track {
		stroke: var(--kiosk-track, rgba(255, 255, 255, 0.15));
	}

	.ring .prog {
		stroke: var(--kiosk-accent, #3fa9f5);
		transition: stroke-dasharray 80ms linear;
	}

	.glyph {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 9px;
		line-height: 1;
		opacity: 0.9;
	}

	.meta {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 2.8rem;
		padding-right: 0.15rem;
	}

	.tag {
		font-weight: 700;
		font-size: 10px;
		opacity: 0.9;
	}

	.phase {
		font-size: 9px;
		text-transform: uppercase;
		opacity: 0.65;
	}

	.icon-btn {
		width: 1.6rem;
		height: 1.6rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		cursor: pointer;
		opacity: 0.75;
		font-size: 11px;
	}

	.icon-btn:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.08);
	}

	.icon-btn.stop {
		color: var(--kiosk-danger, #e5484d);
	}
</style>
