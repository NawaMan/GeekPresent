// @vitest-environment node
//
// SAVE following a Block into the component that holds it: the compile-time
// stamp (which file wrote each tag), the fence on the file the browser names,
// and the save endpoint patching each change into its own file.
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ViteDevServer } from 'vite';
import { resolveStampedFile, stampPath, stampSourceFile } from '../src/lib/adjust/sourceTag';
import { handleAdjustSave } from '../src/lib/adjust/devSavePlugin';

const FILE = 'src/routes/deck/Scene.svelte';

describe('stampSourceFile', () => {
	it('stamps every Block-family tag, nested in groups and blocks, with the file', () => {
		const code = [
			'<script>import Group from "$lib/components/Group.svelte";</script>',
			'<Group focus="api">',
			'	<TextBlock name="api" x={1} y={2} width={3} height={4}>API</TextBlock>',
			'	{#if on}<ImageBlock name="logo" src={logo} x={0} y={0} width={9} height={9} />{/if}',
			'	{#each list as item}<Block name={item} x={0} y={0} width={1} height={1} />{/each}',
			'</Group>'
		].join('\n');
		const out = stampSourceFile(code, FILE);
		expect(out).toContain(`<TextBlock __file="${FILE}" name="api"`);
		expect(out).toContain(`<ImageBlock __file="${FILE}" name="logo"`);
		expect(out).toContain(`<Block __file="${FILE}" name={item}`);
		// Group itself reports nothing to SAVE, so it isn't stamped.
		expect(out).toContain('<Group focus="api">');
	});

	it('keeps every tag on its own line, so error line numbers are unchanged', () => {
		const code = '<Block x={0} y={0} width={1} height={1} />\n<p>after</p>';
		const out = stampSourceFile(code, FILE);
		expect(out.split('\n')).toHaveLength(2);
	});

	it('leaves code samples alone — in the script, and in an attribute string', () => {
		const code = [
			"<script>const sample = '<Block name=\"x\" x={1} y={1} width={1} height={1}>';</script>",
			"<QuickCode code={'<TextBlock name=\"api\" …>'} />"
		].join('\n');
		expect(stampSourceFile(code, FILE)).toBe(code);
	});

	it('is idempotent, and leaves unparseable source exactly as it was', () => {
		const once = stampSourceFile('<Block x={0} y={0} width={1} height={1} />', FILE);
		expect(stampSourceFile(once, FILE)).toBe(once);
		const broken = '<Block x={0} <div';
		expect(stampSourceFile(broken, FILE)).toBe(broken);
	});

	it('handles a TypeScript script block', () => {
		const code = '<script lang="ts">export let zoom: number = 1;</script>\n<Block x={0} y={0} width={1} height={1} />';
		expect(stampSourceFile(code, FILE)).toContain(`<Block __file="${FILE}"`);
	});
});

describe('stampPath / resolveStampedFile', () => {
	const root = '/proj';

	it('stamps route components only — not $lib, not a ?raw import', () => {
		expect(stampPath('/proj/src/routes/deck/Scene.svelte', root)).toBe(FILE);
		expect(stampPath('/proj/src/lib/components/Block.svelte', root)).toBeNull();
		expect(stampPath('/proj/src/routes/deck/a.html/+page.svelte?raw', root)).toBeNull();
		expect(stampPath('/proj/src/routes/deck/pages.ts', root)).toBeNull();
	});

	it('resolves a stamp back inside src/routes, and refuses anything else', () => {
		expect(resolveStampedFile(FILE, root)).toBe('/proj/' + FILE);
		expect(resolveStampedFile('src/routes/../lib/x.svelte', root)).toBeNull();
		expect(resolveStampedFile('../other/src/routes/x.svelte', root)).toBeNull();
		expect(resolveStampedFile('/proj/src/routes/x.svelte', root)).toBeNull();
		expect(resolveStampedFile('src/routes/deck/pages.ts', root)).toBeNull();
		expect(resolveStampedFile('', root)).toBeNull();
	});
});

describe('handleAdjustSave — each change into its own file', () => {
	let root: string;
	const sent: unknown[] = [];
	const emitted: string[] = [];
	const server = () =>
		({
			config: { root, base: '/' },
			watcher: { emit: (_e: string, f: string) => emitted.push(f) },
			ws: { send: (m: unknown) => sent.push(m) }
		}) as unknown as ViteDevServer;

	const page = () => path.join(root, 'src/routes/deck/one.html/+page.svelte');
	const scene = () => path.join(root, FILE);

	beforeEach(async () => {
		root = await mkdtemp(path.join(tmpdir(), 'gp-stamp-'));
		await mkdir(path.dirname(page()), { recursive: true });
		await writeFile(scene(), '<TextBlock name="api" x={100} y={100} width={200} height={100}>API</TextBlock>\n');
		await writeFile(page(), '<Scene />\n<Block name="caption" x={10} y={10} width={50} height={20}>Hi</Block>\n');
		sent.length = 0;
		emitted.length = 0;
	});
	afterEach(async () => {
		await rm(root, { recursive: true, force: true });
	});

	const move = (name: string, kind: string, x: number, file?: string) => ({
		kind,
		name,
		before: { x: name === 'api' ? 100 : 10, y: name === 'api' ? 100 : 10, width: name === 'api' ? 200 : 50, height: name === 'api' ? 100 : 20 },
		after: { x, y: name === 'api' ? 100 : 10, width: name === 'api' ? 200 : 50, height: name === 'api' ? 100 : 20 },
		...(file ? { file } : {})
	});

	it('writes a stamped change into the component, an unstamped one into the slide', async () => {
		const { status, payload } = await handleAdjustSave(
			server(),
			JSON.stringify({
				route: '/deck/one.html',
				changes: [move('api', 'TextBlock', 150, FILE), move('caption', 'Block', 40)]
			})
		);
		expect(status).toBe(200);
		expect(payload).toMatchObject({ patched: 2, unmatched: [] });
		expect(await readFile(scene(), 'utf8')).toContain('x={150}');
		expect(await readFile(page(), 'utf8')).toContain('x={40}');
		expect(emitted.sort()).toEqual([page(), scene()].sort());
		expect(sent).toHaveLength(1); // one reload for the whole save
	});

	it('a Block that lives in the scene is NOT found in the slide without its stamp', async () => {
		const { payload } = await handleAdjustSave(
			server(),
			JSON.stringify({ route: '/deck/one.html', changes: [move('api', 'TextBlock', 150)] })
		);
		expect(payload).toMatchObject({ patched: 0 });
		expect(await readFile(scene(), 'utf8')).toContain('x={100}');
	});

	it('refuses a stamp that points outside src/routes, writing nothing', async () => {
		const { status } = await handleAdjustSave(
			server(),
			JSON.stringify({
				route: '/deck/one.html',
				changes: [move('caption', 'Block', 40), move('api', 'TextBlock', 150, '../../etc/x.svelte')]
			})
		);
		expect(status).toBe(400);
		expect(await readFile(page(), 'utf8')).toContain('x={10}');
	});
});
