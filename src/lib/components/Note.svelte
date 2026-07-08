<!--
  Note — a speaker note. Two homes for the same authored content:

  - In a normal deck window, it renders just below the slide in the canvas
    coordinate space (so it scales with the slide), shown only in SCALED display
    mode — there the slide is at an exact factor and the note sits below it,
    reachable by scrolling. In FITTED mode the slide fills the window, so it hides.

  - In a presenter window (loaded with ?present, see stores/presenter), the same
    note renders as the console's notes panel: pinned to the viewport, always
    visible. SlideDeck hides the whole slide with `visibility:hidden`; the note
    flips ITSELF back to visible (visibility is inherited and individually
    overridable), so no portal is needed to lift it out of the hidden slide.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { displayMode } from '$lib/stores/displayMode';
	import {
		presenterMode, deckKeyFromPath, loadChecks, saveChecks
	} from '$lib/stores/presenter';
	$: visible = $displayMode === 'SCALED' || $presenterMode;

	// The deck + slide this note belongs to — the key its check states persist under.
	$: slidePath = $page.url.pathname.replace(/\/+$/, '').split('/').pop() || '';
	$: deckKey = browser ? deckKeyFromPath($page.url.pathname) : '/';

	// Presenter check-off: give each note "line" (direct child element) a leading
	// checkbox the speaker can tick as they cover it. Click toggles just that line;
	// Shift+Click checks that line AND everything above it (a "covered up to here"
	// marker). State is persisted per deck+slide (survives reload/navigation) and can
	// be cleared page-wide or deck-wide from the console (gp:checks-clear event, after
	// it wipes the relevant localStorage). Only in the presenter panel; the SCALED
	// below-slide note stays untouched.
	interface CheckCtx { enabled: boolean; deckKey: string; slidePath: string; }
	function checklist(node: HTMLElement, ctx: CheckCtx) {
		let lines: HTMLElement[] = [];
		let cleanups: Array<() => void> = []; // per-line dblclick listeners to detach
		const setChecked = (line: HTMLElement, on: boolean) => {
			line.classList.toggle('gp-checked', on);
			line.querySelector(':scope > .gp-check')?.setAttribute('aria-checked', String(on));
		};
		const persist = () => saveChecks(ctx.deckKey, ctx.slidePath, lines.map((l) => l.classList.contains('gp-checked')));
		// Toggle line `i`; Shift = cumulative (check it AND everything above). Fired by
		// a checkbox click OR a double-click anywhere on the line.
		const toggle = (e: MouseEvent, i: number) => {
			e.stopPropagation();
			if (e.shiftKey) {
				for (let k = 0; k <= i; k++) setChecked(lines[k], true); // cumulative: up to here
			} else {
				setChecked(lines[i], !lines[i].classList.contains('gp-checked')); // toggle one
			}
			persist();
		};
		// Console-initiated clear: the localStorage was already wiped (page or deck), so
		// just visually uncheck the current lines.
		const onClear = () => lines.forEach((l) => setChecked(l, false));
		function setup() {
			teardown();
			if (!ctx.enabled) return;
			lines = Array.from(node.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
			const saved = loadChecks(ctx.deckKey, ctx.slidePath);
			lines.forEach((line, i) => {
				line.classList.add('gp-note-line');
				const box = document.createElement('span');
				box.className = 'gp-check';
				box.setAttribute('role', 'checkbox');
				box.addEventListener('click', (e) => toggle(e as MouseEvent, i)); // removed with the box
				line.insertBefore(box, line.firstChild);
				// Double-click anywhere on the line toggles too (Shift = cumulative). The
				// line element persists (slot content), so track this listener for cleanup.
				const onDbl = (e: Event) => toggle(e as MouseEvent, i);
				line.addEventListener('dblclick', onDbl);
				cleanups.push(() => line.removeEventListener('dblclick', onDbl));
				setChecked(line, !!saved[i]); // restore persisted state
			});
			window.addEventListener('gp:checks-clear', onClear);
		}
		function teardown() {
			window.removeEventListener('gp:checks-clear', onClear);
			cleanups.forEach((fn) => fn());
			cleanups = [];
			lines.forEach((line) => {
				line.classList.remove('gp-note-line', 'gp-checked');
				line.querySelector(':scope > .gp-check')?.remove();
			});
			lines = [];
		}
		setup();
		return {
			update(next: CheckCtx) { ctx = next; setup(); },
			destroy: teardown
		};
	}
</script>

{#if visible}
<div class="note no-print" class:presenter={$presenterMode} use:checklist={{ enabled: $presenterMode, deckKey, slidePath }}>
	<slot></slot>
</div>
{/if}

<style>
.note {
	position: absolute;
	display: block;
	width: calc(100% - 30px);
	top: calc(100% + 30px);
	left: 0;
	padding: 15px;

	color: #000;
	background-color: beige;

	border: 1.5px solid #fff;
	border-radius: 7.5px;

	min-height: 225px;
	max-height: 225px;
	overflow-y: scroll;

	font-size: larger;
	font-family: ui-sans-serif, system-ui, Segoe UI, Helvetica, Apple Color Emoji, Arial, sans-serif, Segoe UI Emoji, Segoe UI Symbol;
}

/* Presenter console: the note becomes the right-hand notes panel, pinned to the
   viewport (not the slide). `visibility:visible` overrides the hidden slide
   SlideDeck sits it inside. Geometry reads the SAME --gp-* layout vars
   PresenterView sets on <body.gp-present> (inherited here), so the panel's left
   edge lands a half-gap RIGHT of --gp-split and butts the preview column with an
   exact --gp-gap between them — no overlap. */
.note.presenter {
	position: fixed;
	visibility: visible;
	top: var(--gp-inset, 20px);
	left: calc(var(--gp-split, 50vw) + var(--gp-gap, 16px) / 2);
	right: var(--gp-inset, 20px);
	/* Override the SCALED-mode `width: calc(100% - 30px)`, which would otherwise win
	   over left+right and push the panel off the right edge. left+right size it. */
	width: auto;
	bottom: calc(var(--gp-bar-h, 130px) + var(--gp-inset, 20px));
	/* Override the SCALED-mode below-slide box: fill the panel instead. */
	min-height: 0;
	max-height: none;
	z-index: 60;

	padding: 24px 28px;
	font-size: 1.5rem;
	line-height: 1.5;
	border-radius: 10px;
	box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
}

/* Per-line check-off (added to slotted children by the `checklist` action, so
   these must be :global). The leading box is inline-block, which stops the checked
   line's line-through from striking the checkbox glyph itself. */
/* Lines are double-click-to-toggle targets, so suppress the text selection a
   double-click would otherwise make (it's a check-off aid, not prose to select). */
.note.presenter :global(.gp-note-line) {
	user-select: none;
}
.note.presenter :global(.gp-check) {
	display: inline-block;
	margin-right: 0.5em;
	cursor: pointer;
	user-select: none;
	color: #2563a8;
	line-height: 1;
}
.note.presenter :global(.gp-check)::before {
	content: '\2610'; /* ☐ */
}
.note.presenter :global(.gp-checked) > :global(.gp-check)::before {
	content: '\2611'; /* ☑ */
}
.note.presenter :global(.gp-checked) {
	text-decoration: line-through;
	opacity: 0.5;
}
</style>
