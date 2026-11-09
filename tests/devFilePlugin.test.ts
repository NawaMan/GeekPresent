// The EDIT window's file endpoints, driven against a temp project (as
// noteEdit.test.ts does): list, load, fingerprinted save, import resolution —
// and every refusal leaves the disk untouched.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import {
	handleFileLoad,
	handleFileResolve,
	handleFileSave,
	handleFileTree,
	listEditableFiles
} from '../src/lib/source/devFilePlugin';

const PAGE = 'src/routes/deck/one.html/+page.svelte';

describe('file-tree / file-load / file-save / file-resolve', () => {
	let root: string;
	let outside: string;
	const abs = (rel: string) => path.join(root, rel);
	const put = async (rel: string, text: string) => {
		await mkdir(path.dirname(abs(rel)), { recursive: true });
		await writeFile(abs(rel), text);
	};
	const load = (rel: string) =>
		handleFileLoad(root, `/__geekpresent/file-load?path=${encodeURIComponent(rel)}`);
	const save = (rel: unknown, content: unknown, fingerprint: unknown) =>
		handleFileSave(root, JSON.stringify({ path: rel, content, fingerprint }));
	const resolve = (from: string, spec: string) =>
		handleFileResolve(
			root,
			`/__geekpresent/file-resolve?from=${encodeURIComponent(from)}&spec=${encodeURIComponent(spec)}`
		);

	beforeEach(async () => {
		root = await mkdtemp(path.join(tmpdir(), 'gp-files-'));
		outside = await mkdtemp(path.join(tmpdir(), 'gp-outside-'));
		await put(PAGE, "<script>import S from './Scene.svelte';</script>\n<S />\n");
		await put('src/routes/deck/one.html/Scene.svelte', '<p>scene</p>\n');
		await put('src/lib/utils/drag.ts', 'export const x = 1;\n');
		await put('src/lib/components/pic.png', 'PNG');
		await put('src/lib/.hidden/a.ts', 'x');
		await put('src/app.html', '<html></html>');
		await put('package.json', '{}');
		await writeFile(path.join(outside, 'secret.ts'), 'secret');
		await symlink(outside, abs('src/lib/escape'));
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
		await rm(outside, { recursive: true, force: true });
	});

	it('lists only editable files, never following a symlink out', async () => {
		expect(await listEditableFiles(root)).toEqual([
			'src/lib/utils/drag.ts',
			'src/routes/deck/one.html/+page.svelte',
			'src/routes/deck/one.html/Scene.svelte'
		]);
		const tree = await handleFileTree(root);
		expect(tree.status).toBe(200);
		expect(tree.payload.files).toHaveLength(3);
	});

	it('loads a file with a fingerprint, and saves an edit quoting it', async () => {
		const loaded = await load('src/lib/utils/drag.ts');
		expect(loaded.status).toBe(200);
		const { content, fingerprint } = loaded.payload as { content: string; fingerprint: string };
		expect(content).toBe('export const x = 1;\n');

		const saved = await save('src/lib/utils/drag.ts', 'export const x = 2;\n', fingerprint);
		expect(saved.status).toBe(200);
		expect(saved.payload.fingerprint).not.toBe(fingerprint);
		expect(await readFile(abs('src/lib/utils/drag.ts'), 'utf8')).toBe('export const x = 2;\n');

		// The new fingerprint is what the next save must quote.
		const again = await save(
			'src/lib/utils/drag.ts',
			'export const x = 3;\n',
			saved.payload.fingerprint
		);
		expect(again.status).toBe(200);
	});

	it('refuses (409) a save from a stale version, leaving the newer file alone', async () => {
		const { fingerprint } = (await load(PAGE)).payload as { fingerprint: string };
		await writeFile(abs(PAGE), '<p>someone else saved this</p>\n'); // ADJUST SAVE, say
		const r = await save(PAGE, '<p>mine</p>\n', fingerprint);
		expect(r.status).toBe(409);
		expect(r.payload.reason).toBe('conflict');
		expect(await readFile(abs(PAGE), 'utf8')).toBe('<p>someone else saved this</p>\n');
	});

	it('refuses paths outside the allowlist, through a symlink, or that do not exist', async () => {
		const status = async (rel: string) => (await load(rel)).status;
		expect(await status('package.json')).toBe(403);
		expect(await status('src/app.html')).toBe(403);
		expect(await status('src/lib/../../package.json')).toBe(403);
		expect(await status('src/lib/.hidden/a.ts')).toBe(403);
		expect(await status('src/lib/components/pic.png')).toBe(403);
		expect(await status('src/lib/escape/secret.ts')).toBe(403);
		expect(await status('src/lib/nope.ts')).toBe(404);
		expect(await status('src/lib/utils')).toBe(403); // no extension: never a folder read

		// Writes refuse the same way, and create nothing.
		expect((await save('src/lib/escape/secret.ts', 'pwned', 'x')).status).toBe(403);
		expect(await readFile(path.join(outside, 'secret.ts'), 'utf8')).toBe('secret');
		expect((await save('src/lib/new.ts', 'x', 'x')).status).toBe(404);
	});

	it('refuses an empty write and a malformed body', async () => {
		const { fingerprint } = (await load(PAGE)).payload as { fingerprint: string };
		expect((await save(PAGE, '', fingerprint)).status).toBe(400);
		expect((await save(PAGE, 'x', undefined)).status).toBe(400);
		expect((await handleFileSave(root, '{nope')).status).toBe(400);
		expect(await readFile(abs(PAGE), 'utf8')).toContain('Scene.svelte');
	});

	it('resolves an import to the editable file it names', async () => {
		expect((await resolve(PAGE, './Scene.svelte')).payload.file).toBe(
			'src/routes/deck/one.html/Scene.svelte'
		);
		expect((await resolve(PAGE, '$lib/utils/drag')).payload.file).toBe('src/lib/utils/drag.ts');
		expect((await resolve(PAGE, '$lib/utils/drag.js')).payload.file).toBe('src/lib/utils/drag.ts');
		expect((await resolve(PAGE, './+page.svelte?raw')).payload.file).toBe(PAGE);
	});

	it('says why an import does not resolve', async () => {
		const pkg = await resolve(PAGE, 'svelte/store');
		expect(pkg.status).toBe(404);
		expect(pkg.payload.error).toMatch(/package/);
		expect((await resolve(PAGE, '$lib/missing')).status).toBe(404);
		expect((await resolve(PAGE, '$lib/escape/secret.ts')).status).toBe(404);
		expect((await resolve('package.json', './x')).status).toBe(400);
	});
});
