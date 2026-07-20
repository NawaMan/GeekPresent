<!--
  Kiosk notes caption — window-fixed band showing the current slide's <Note>.

  Lives outside the scaled canvas (next to the kiosk indicator) so `position:fixed`
  tracks the viewport. Text comes from stores/kiosk.kioskNoteText, which <Note>
  publishes while kiosk + "Show speaker notes" is on.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { kioskActive, kioskPaces, kioskNoteText } from '$lib/stores/kiosk';

	$: show = browser && $kioskActive && $kioskPaces.useNotes && !!$kioskNoteText;
</script>

{#if show}
	<aside
		class="kiosk-notes no-print gp-chrome"
		role="note"
		aria-label="Speaker notes"
	>
		{$kioskNoteText}
	</aside>
{/if}

<style>
	.kiosk-notes {
		position: fixed;
		left: 12px;
		right: 12px;
		/* Above the bottom-left kiosk chip */
		bottom: 52px;
		z-index: 55;
		max-height: min(28vh, 220px);
		overflow-y: auto;
		padding: 0.65rem 1rem;
		border-radius: 10px;
		border: 1px solid var(--kiosk-edge, rgba(255, 255, 255, 0.28));
		background: var(--kiosk-panel-bg, rgba(20, 22, 26, 0.96));
		color: var(--kiosk-fg, #d7dde5);
		font-size: 0.95rem;
		font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Arial, sans-serif;
		line-height: 1.45;
		box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
		white-space: pre-wrap;
	}
</style>
