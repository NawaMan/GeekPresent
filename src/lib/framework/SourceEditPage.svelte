<!--
  Unscaled source editor — opened by ViewSource/SourceView EDIT into a separate window.

  Why a window: the slide canvas uses CSS transform: scale(...). Monaco's caret
  and glyph metrics are computed in untransformed CSS pixels, so inside the
  canvas the caret drifts. Here there is no scale: 1 CSS px = 1 layout px.

  SAVE    — Ctrl/Cmd+S, or Alt+. then s — write buffer; window stays open.
  REFRESH — Ctrl/Cmd+Shift+R, or Alt+. then r — re-read disk. Confirms if buffer ≠ disk.
  CLOSE   — Esc, or Alt+. then c — leave the editor; confirms if the buffer is dirty.

  Alt+. arms R/S/C for a few seconds (amber bar). Using any of those letters, or
  pressing Alt+. again, ends arm mode — so SAVE does not leave C live for a stray close.

  Keys are taken in the CAPTURE phase so Monaco cannot swallow Esc / the armed letters.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Code from '$lib/components/Code.svelte';
	import { savePageSource, loadPageSource } from '$lib/stores/sourceSave';
	import {
		SOURCE_EDIT_MSG,
		SOURCE_EDIT_STORAGE_KEY,
		isSourceEditMessage,
		parseSourceEditPayload,
		type SourceEditPayload
	} from '$lib/source/sourceEditSession';
	import { sourceEditKeyIntent } from '$lib/source/sourceEditKeyCore';

	let payload: SourceEditPayload | null = null;
	/** Baseline last loaded or saved — used for SAVE's NONE check. */
	let baseline = '';
	let codeRef: {
		getValue: () => string;
		isDirty: () => boolean;
		markClean: () => void;
		setValue: (next: string) => void;
	} | undefined;

	// Shared flash for SAVE and REFRESH (same badge slot).
	let actionLabel = 'SAVE';
	let actionRefused = false;
	let actionTip = '';
	let actionTimer: ReturnType<typeof setTimeout> | undefined;
	const notAllowedTip = 'Save not allowed in this setup.';
	const refreshNotAllowedTip = 'Refresh not allowed in this setup.';

	// Mini chrome-arm for this window only (same idea as the deck's Alt+.).
	// While armed, r/s/c fire even with the caret inside Monaco. One letter ends arm mode.
	let keysArmed = false;
	let armTimer: ReturnType<typeof setTimeout> | undefined;
	const ARM_MS = 5000;

	function armKeys() {
		keysArmed = true;
		clearTimeout(armTimer);
		armTimer = setTimeout(() => {
			keysArmed = false;
			armTimer = undefined;
		}, ARM_MS);
	}

	function disarmKeys() {
		keysArmed = false;
		if (armTimer) {
			clearTimeout(armTimer);
			armTimer = undefined;
		}
	}

	function flashAction(label: string, ms: number, opts?: { refused?: boolean; tip?: string }) {
		actionLabel = label;
		actionRefused = !!opts?.refused;
		actionTip = opts?.tip ?? '';
		clearTimeout(actionTimer);
		actionTimer = setTimeout(() => {
			actionLabel = 'SAVE';
			actionRefused = false;
			actionTip = '';
		}, ms);
	}

	function applyPayload(next: SourceEditPayload, { force = false } = {}) {
		if (
			!force &&
			payload &&
			codeRef?.isDirty?.() &&
			(next.route !== payload.route || next.source !== baseline)
		) {
			const ok = confirm(
				'You have unsaved edits in the source editor.\n\nDiscard them and load the new source?'
			);
			if (!ok) return;
		}
		payload = next;
		baseline = next.source;
		document.title = next.path ? `Source — ${next.path}` : 'Source';
		// Force Monaco onto the new bytes even if it still thinks it is dirty.
		if (codeRef?.setValue) codeRef.setValue(next.source);
		else codeRef?.markClean?.();
	}

	function readFromStorage() {
		if (!browser) return;
		try {
			const raw = sessionStorage.getItem(SOURCE_EDIT_STORAGE_KEY);
			const p = parseSourceEditPayload(raw);
			if (p) applyPayload(p, { force: true });
		} catch {
			/* ignore */
		}
	}

	function onMessage(event: MessageEvent) {
		if (event.origin !== window.location.origin) return;
		if (!isSourceEditMessage(event.data)) return;
		const p = parseSourceEditPayload(event.data);
		if (p) applyPayload(p);
	}

	async function onSave() {
		if (!payload) return;
		if (!payload.canSave) {
			flashAction('NOT ALLOWED', 2600, { refused: true, tip: notAllowedTip });
			return;
		}
		const content = codeRef?.getValue() ?? payload.source;
		if (content === baseline) {
			flashAction('NONE', 1600);
			return;
		}
		const r = await savePageSource(content, payload.route);
		if (!r.ok) {
			flashAction('ERROR', 1600);
			console.error('[source save] failed:', r.error);
			return;
		}
		baseline = content;
		// Keep payload.source in step so a later REFRESH compares cleanly.
		payload = { ...payload, source: content };
		codeRef?.markClean();
		flashAction('SAVED', 1600);
	}

	async function onRefresh() {
		if (!payload) return;
		// Load endpoint only exists under vite dev — same gate as SAVE.
		if (!payload.canSave) {
			flashAction('NOT ALLOWED', 2600, { refused: true, tip: refreshNotAllowedTip });
			return;
		}

		const r = await loadPageSource(payload.route);
		if (!r.ok || typeof r.content !== 'string') {
			flashAction('ERROR', 1600);
			console.error('[source load] failed:', r.error);
			return;
		}

		const buffer = codeRef?.getValue() ?? payload.source;
		if (buffer === r.content) {
			// Already matches disk — still reset baseline in case an external
			// write matched by coincidence after we drifted and came back.
			baseline = r.content;
			payload = { ...payload, source: r.content };
			codeRef?.markClean();
			flashAction('CURRENT', 1600);
			return;
		}

		const ok = confirm(
			'The editor buffer differs from the file on disk.\n\n' +
				'Reload from disk and discard the buffer?\n\n' +
				'(This picks up ADJUST SAVE and other external edits.)'
		);
		if (!ok) {
			flashAction('KEEP', 1600);
			return;
		}

		baseline = r.content;
		payload = { ...payload, source: r.content };
		if (codeRef?.setValue) codeRef.setValue(r.content);
		else codeRef?.markClean?.();
		flashAction('RELOADED', 1600);
	}

	function isDirty(): boolean {
		if (!payload) return false;
		if (codeRef?.isDirty?.()) return true;
		const buf = codeRef?.getValue?.();
		return typeof buf === 'string' && buf !== baseline;
	}

	function onClose() {
		if (isDirty()) {
			const ok = confirm(
				'You have unsaved edits in the source editor.\n\nClose without saving?'
			);
			if (!ok) return;
		}
		window.close();
		setTimeout(() => {
			if (!window.closed) {
				document.body.insertAdjacentHTML(
					'beforeend',
					'<p class="close-fallback">You can close this tab manually.</p>'
				);
			}
		}, 100);
	}

	/**
	 * Capture-phase listener: Monaco steals Esc (and would steal bare r/s/c while
	 * the caret is in the buffer). Decisions live in sourceEditKeyCore (pure, tested).
	 */
	function onKeydown(event: KeyboardEvent) {
		const intent = sourceEditKeyIntent(event, keysArmed);
		if (intent === 'ignore') return;

		event.preventDefault();
		event.stopPropagation();

		switch (intent) {
			case 'arm-toggle':
				if (keysArmed) disarmKeys();
				else armKeys();
				return;
			case 'save':
				// Armed letter is one-shot; Ctrl+S does not need arm state.
				disarmKeys();
				onSave();
				return;
			case 'refresh':
				disarmKeys();
				onRefresh();
				return;
			case 'close':
				disarmKeys();
				onClose();
				return;
		}
	}

	onMount(() => {
		readFromStorage();
		window.addEventListener('message', onMessage);
		// Capture = true: run before Monaco's bubble handlers.
		window.addEventListener('keydown', onKeydown, true);
		return () => {
			window.removeEventListener('message', onMessage);
			window.removeEventListener('keydown', onKeydown, true);
			disarmKeys();
		};
	});

	onDestroy(() => {
		clearTimeout(actionTimer);
		disarmKeys();
	});

	$: pathLabel = payload?.path || '(no file loaded — open EDIT from a slide)';
	$: canSave = payload?.canSave ?? false;
	$: language = payload?.language || 'html';
	$: code = payload?.source ?? '';
	// Show flash next to whichever control last acted; default badge parks on SAVE.
	$: showFlash = actionLabel !== 'SAVE' || actionRefused;
</script>

<svelte:head>
	<title>Source</title>
</svelte:head>

<div class="shell">
	<header class="bar" class:armed={keysArmed}>
		<div class="path" title={pathLabel}>{pathLabel}</div>
		<div class="actions">
			<button
				type="button"
				class="btn refresh"
				disabled={!payload}
				title="REFRESH — Ctrl+Shift+R, or Alt+. then R (confirms if the buffer differs)"
				on:click={onRefresh}
			><span class="mn">R</span>EFRESH</button>
			<span class="action-wrap" class:refused={actionRefused}>
				<button
					type="button"
					class="btn save"
					disabled={!payload}
					title="SAVE — Ctrl+S, or Alt+. then S"
					on:click={onSave}
				><span class="mn">S</span>AVE</button>
				{#if showFlash}
					<span class="action-pop">
						{#if actionLabel !== 'SAVE'}
							<span class="action-flash">{actionLabel}</span>
						{/if}
						{#if actionRefused && actionTip}
							<span class="action-tip" role="status">{actionTip}</span>
						{/if}
					</span>
				{/if}
			</span>
			<button
				type="button"
				class="btn close"
				title="CLOSE — Esc, or Alt+. then C (confirms if unsaved)"
				on:click={onClose}
			><span class="mn">C</span>LOSE</button>
		</div>
	</header>

	<main class="editor">
		{#if payload}
			<Code
				bind:this={codeRef}
				{code}
				{language}
				width="100%"
				height="100%"
				fontSize={15}
				readOnly={!canSave}
			/>
		{:else}
			<p class="empty">
				No source loaded. From a slide, open <b>☰ → EDIT</b> (or SOURCE then the
				CodeBox <b>EDIT</b> button).
			</p>
		{/if}
	</main>

	{#if payload && !canSave}
		<p class="hint">Read-only here (not vite dev). SAVE / REFRESH answer NOT ALLOWED.</p>
	{/if}
</div>

<style>
	.shell {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		background: #1e1e1e;
		color: #d4d4d4;
		font-family: 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
	}
	.bar {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding: 0.55em 0.9em;
		background: #252526;
		border-bottom: 1px solid #333;
		min-height: 3em;
		box-sizing: border-box;
		transition: box-shadow 120ms ease;
	}
	/* Alt+. armed — same cue as the deck tool bar so R/S/C read as live. */
	.bar.armed {
		box-shadow: inset 0 0 0 2px color-mix(in srgb, #f0a33e 55%, transparent);
	}
	.bar.armed .btn .mn {
		color: #f0a33e;
	}
	.path {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		font-weight: 600;
		color: #fff;
	}
	.actions {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}
	.btn {
		appearance: none;
		border: 1px solid #444;
		border-radius: 6px;
		padding: 0.35em 0.9em;
		font: inherit;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.04em;
		cursor: pointer;
		color: #f0a33e;
		background: rgba(255, 255, 255, 0.06);
	}
	.btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
	}
	.btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn.close {
		color: #ccc;
	}
	.btn.refresh {
		color: #7fd9ff;
	}
	/* Mnemonic letter on the bar buttons (R / S / C) — same underline cue as deck chrome. */
	.btn .mn {
		text-decoration: underline;
		text-underline-offset: 0.15em;
		text-decoration-thickness: 1px;
	}
	.action-wrap {
		position: relative;
	}
	.action-pop {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
		pointer-events: none;
	}
	.action-flash {
		white-space: nowrap;
		padding: 0.15em 0.6em;
		border-radius: 6px;
		font-size: 11px;
		font-weight: bold;
		background: #000;
		color: #f0a33e;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	.action-wrap.refused .action-flash {
		color: #e5484d;
		border-color: #e5484d;
	}
	.action-tip {
		max-width: 18em;
		text-align: right;
		padding: 0.3em 0.7em;
		border-radius: 6px;
		font-size: 11px;
		font-weight: bold;
		background: #000;
		color: #fff;
		border: 1px solid #e5484d;
	}
	.editor {
		flex: 1 1 auto;
		min-height: 0;
		position: relative;
	}
	.editor :global(> div) {
		width: 100% !important;
		height: 100% !important;
	}
	.empty {
		margin: 2em;
		line-height: 1.5;
		opacity: 0.85;
	}
	.hint {
		flex: 0 0 auto;
		margin: 0;
		padding: 0.4em 0.9em;
		font-size: 12px;
		opacity: 0.7;
		border-top: 1px solid #333;
	}
	:global(.close-fallback) {
		position: fixed;
		bottom: 1em;
		left: 50%;
		transform: translateX(-50%);
		background: #000;
		color: #fff;
		padding: 0.5em 1em;
		border-radius: 6px;
		font-size: 13px;
	}
</style>
