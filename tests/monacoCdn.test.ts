import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// loadMonaco keeps its promise at module level, so each test gets a fresh module.
async function freshLoader() {
	vi.resetModules();
	return import('../src/lib/utils/monacoCdn');
}

type AnyWindow = Window & Record<string, unknown>;
const w = window as unknown as AnyWindow;

function loaderScripts() {
	return [...document.querySelectorAll('script')].filter((s) => s.src.endsWith('/vs/loader.js'));
}

/** Play the CDN's part: loader.js defines an AMD `require`; editor.main defines `monaco`. */
function fakeAmd(onRequire?: () => void) {
	const defineTheme = vi.fn();
	const require = Object.assign(
		(_deps: string[], ok: () => void) => {
			onRequire?.();
			w.monaco = { editor: { defineTheme } };
			ok();
		},
		{ config: vi.fn() }
	);
	w.require = require;
	return { require, defineTheme };
}

beforeEach(() => {
	delete w.monaco;
	delete w.require;
	delete w.MonacoEnvironment;
	loaderScripts().forEach((s) => s.remove());
});
afterEach(() => vi.restoreAllMocks());

describe('loadMonaco', () => {
	it('injects ONE loader for any number of editors, at the pinned version', async () => {
		const { loadMonaco, MONACO_VERSION } = await freshLoader();
		const a = loadMonaco();
		const b = loadMonaco();
		expect(a).toBe(b);
		expect(loaderScripts()).toHaveLength(1);
		expect(loaderScripts()[0].src).toContain(`/monaco-editor/${MONACO_VERSION}/min/vs/loader.js`);
	});

	it('configures the AMD paths and the worker shim, and defines the page theme', async () => {
		const { loadMonaco, MONACO_VERSION, MONACO_THEME } = await freshLoader();
		const pending = loadMonaco();
		const { require, defineTheme } = fakeAmd();
		loaderScripts()[0].onload!(new Event('load'));
		const monaco = await pending;

		expect(monaco).toBe(w.monaco);
		expect(require.config).toHaveBeenCalledWith({
			paths: { vs: `https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/${MONACO_VERSION}/min/vs` }
		});
		const env = w.MonacoEnvironment as { getWorkerUrl: () => string };
		const shim = decodeURIComponent(env.getWorkerUrl());
		expect(shim.startsWith('data:text/javascript')).toBe(true);
		expect(shim).toContain(`${MONACO_VERSION}/min/vs/base/worker/workerMain.js`);
		expect(defineTheme).toHaveBeenCalledWith(
			MONACO_THEME,
			expect.objectContaining({ base: 'vs-dark' })
		);
	});

	it('reuses a Monaco already on the page without touching the DOM', async () => {
		const { loadMonaco } = await freshLoader();
		const existing = { editor: {} };
		w.monaco = existing;
		await expect(loadMonaco()).resolves.toBe(existing);
		expect(loaderScripts()).toHaveLength(0);
	});

	it('forgets a failed load, so the next editor tries again', async () => {
		const { loadMonaco } = await freshLoader();
		const first = loadMonaco();
		loaderScripts()[0].onerror!(new Event('error'));
		await expect(first).rejects.toThrow(/could not load/);
		loaderScripts().forEach((s) => s.remove());

		const second = loadMonaco();
		expect(second).not.toBe(first);
		expect(loaderScripts()).toHaveLength(1);
	});
});
