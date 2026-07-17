<script>
	// Generic code viewer/editor built on the Monaco editor (loaded from a CDN).
	// Distilled from JavaCode.svelte, but language is a parameter and it relies
	// on Monaco's built-in, language-aware folding rather than a custom
	// Java/brace-specific provider.
	//
	// Default is READ-ONLY (every deck Code/CodeBox usage). ViewSource flips
	// `readOnly={false}` under vite dev so the buffer can be typed into and
	// SAVEd back to disk.
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let code           = '';
	export let language       = 'java';
	export let width          = '1200px';
	export let height         = '600px';
	export let fontSize       = 20;   // Monaco's font (fixed px); overridable per usage.
	export let foldAllAtStart = false;
	/** When true (default), the buffer cannot be typed into. */
	export let readOnly       = true;

	// @ts-ignore
	export let revealLines = [];
	// @ts-ignore
	export let cursorLine = 1;

	/** Inline style for the root element, applied last so it wins. */
	export let style = '';
	/** DOM id for the root element. */
	export let id = '';
	/** Extra class(es) for the root element. NOTE: a slide's own style block is scoped, so a
	    class defined there will NOT match — use global CSS (global.css / roles.css / a
	    :global(...) block) or a utility class. See AGENTS.md. */
	let klass = '';
	export { klass as class };

	// @ts-ignore
	let editor;
	// @ts-ignore
	let editorElement;
	// Local edits while the parent still holds the prop from the last `?raw` import.
	// HMR updates `code`; we only re-sync the model when the buffer is clean.
	let dirty = false;

	/** Current buffer — Monaco when live, else the prop (jsdom / before mount). */
	export function getValue() {
		// @ts-ignore
		if (editor) return editor.getValue();
		return code;
	}

	/** True after the user has typed something that differs from `code`. */
	export function isDirty() {
		return dirty;
	}

	/** Clear the dirty flag (e.g. after a successful SAVE, before HMR lands). */
	export function markClean() {
		dirty = false;
	}

	/** Force the buffer to `next` and clear dirty (REFRESH from disk). */
	export function setValue(next) {
		// @ts-ignore
		if (editor) editor.setValue(next);
		dirty = false;
	}

	$: {
		// @ts-ignore
		revealTheLines(revealLines);
	}

	// Keep the model in step with the prop when the user has not typed, and keep
	// Monaco's readOnly option in step with the prop (dev vs build).
	$: syncFromProps(code, readOnly);

	// @ts-ignore
	function syncFromProps(nextCode, nextReadOnly) {
		// @ts-ignore
		if (!editor) return;
		// @ts-ignore
		editor.updateOptions({ readOnly: nextReadOnly });
		if (dirty) return;
		// @ts-ignore
		if (editor.getValue() !== nextCode) {
			// @ts-ignore
			editor.setValue(nextCode);
		}
	}

	// @ts-ignore
	function unfoldLines(lineNumbers) {
		// @ts-ignore
		lineNumbers.forEach(lineNumber => {
			if (Object.prototype.toString.call(lineNumber) === '[object Array]') {
				setTimeout(function () {
					unfoldLines(lineNumber);
				}, 200);
				return;
			}
			// @ts-ignore
			editor.setSelection({
				startLineNumber: lineNumber,
				startColumn: 0,
				endLineNumber: lineNumber,
				endColumn: 1
			});
			// @ts-ignore
			editor.revealLine(cursorLine);
			// @ts-ignore
			editor.trigger('keyboard', 'editor.unfold');
		});
	}

	// @ts-ignore
	function revealTheLines(lines = []) {
		// @ts-ignore
		if (editor == null)
			return;

		if (lines.length === 0) {
			// @ts-ignore
			lines = revealLines;
		}

		if (foldAllAtStart) {
			setTimeout(function () {
				// @ts-ignore
				editor.trigger('keyboard', 'editor.foldAll');
				// @ts-ignore
				unfoldLines(revealLines);
			}, 200);
		} else if (revealLines.length > 0) {
			// @ts-ignore
			editor.setScrollTop(editor.getTopForLineNumber(revealLines[0]));
		}
	}

	onMount(() => {
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs/loader.js';
		script.onload = initMonaco;
		document.body.appendChild(script);

		return () => {
			// @ts-ignore
			if (editor) {
				editor.dispose();
			}
		};
	});

	function initMonaco() {
		if (browser) {
			// Worker-backed languages (javascript / typescript) spin up the TS
			// language service in a Web Worker for diagnostics. Monaco is loaded
			// cross-origin from a CDN, so the default worker URL is cross-origin and
			// the browser blocks creating a Worker from it — which throws and leaves
			// the editor blank (java / python are tokenizer-only, so they were fine).
			// Point getWorkerUrl at a same-origin data-URL shim that importScripts the
			// CDN's workerMain, the standard cross-origin workaround for AMD Monaco.
			const monacoBase = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/';
			// @ts-ignore
			window.MonacoEnvironment = {
				getWorkerUrl: function () {
					return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
						`self.MonacoEnvironment = { baseUrl: '${monacoBase}' };\n` +
						`importScripts('${monacoBase}vs/base/worker/workerMain.js');`
					);
				}
			};
			// @ts-ignore
			window.require.config({
				paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.21.2/min/vs' }
			});
			// @ts-ignore
			window.require(['vs/editor/editor.main'], function () {
				// @ts-ignore
				editor = monaco.editor.create(editorElement, {
					value: code,
					// Monaco sizes its own font in fixed px, so it ignores the canvas
					// font-size lever — it comes from the `fontSize` prop instead.
					// Pin the family to the deck's monospace so glyph metrics match
					// the rendered text (a mismatch is another way carets drift).
					fontSize,
					fontFamily: "Fira Code, Menlo, Monaco, 'Courier New', monospace",
					fontLigatures: true,
					language: language,
					minimap: { enabled: true },
					folding: true,
					automaticLayout: true,
					readOnly,
					theme: 'vs-dark',
					foldingImportsByDefault: true
				});

				// @ts-ignore
				editor.onDidChangeModelContent(() => {
					// @ts-ignore
					dirty = editor.getValue() !== code;
				});

				revealTheLines();
			});
		}
	}
</script>

<div bind:this={editorElement} class={klass || undefined} id={id || undefined} style="width: {width}; height: {height}; {style}"></div>
