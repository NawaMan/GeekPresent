// The EDIT window's pure cores: what may be edited, how an import resolves, the
// file tree, and the tab session that survives a reload.
import { describe, expect, it } from 'vitest';
import { checkEditablePath, extensionOf, languageFor } from '../src/lib/source/fileAccessCore';
import {
	importCandidates,
	importSpecifiersIn,
	isLocalSpecifier
} from '../src/lib/source/importResolveCore';
import { ancestorsOf, buildTree, filterFiles, visibleRows } from '../src/lib/source/fileTreeCore';
import {
	closeTab,
	emptySession,
	encodeSession,
	openTab,
	parseSession,
	setDraft,
	tabLabel
} from '../src/lib/source/ideSessionCore';
import { parseSourceEditPayload } from '../src/lib/source/sourceEditSession';

describe('checkEditablePath', () => {
	it('accepts source files under src/routes and src/lib, normalised', () => {
		expect(checkEditablePath('src/routes/slides/a.html/+page.svelte')).toEqual({
			ok: true,
			path: 'src/routes/slides/a.html/+page.svelte'
		});
		expect(checkEditablePath('./src/lib/utils/x.ts')).toEqual({
			ok: true,
			path: 'src/lib/utils/x.ts'
		});
		expect(checkEditablePath('src\\lib\\styles\\note.css')).toEqual({
			ok: true,
			path: 'src/lib/styles/note.css'
		});
	});

	it('refuses everything else, and says why', () => {
		const reason = (p: unknown) => {
			const r = checkEditablePath(p);
			return r.ok ? 'ok' : r.reason;
		};
		expect(reason('')).toBe('empty');
		expect(reason(42)).toBe('empty');
		expect(reason('/etc/passwd')).toBe('absolute');
		expect(reason('C:/x/src/lib/a.ts')).toBe('absolute');
		expect(reason('src/lib/../../package.json')).toBe('traversal');
		expect(reason('src//lib/a.ts')).toBe('traversal');
		expect(reason('src/lib/')).toBe('traversal');
		expect(reason('src/lib/.secret/a.ts')).toBe('hidden');
		expect(reason('src/routes/.env')).toBe('hidden');
		expect(reason('src/lib/node_modules/x/index.js')).toBe('outside');
		expect(reason('package.json')).toBe('outside');
		expect(reason('src/app.html')).toBe('outside');
		expect(reason('vite.config.ts')).toBe('outside');
		expect(reason('src/libx/a.ts')).toBe('outside');
		expect(reason('src/routes/slides/pic.png')).toBe('extension');
		expect(reason('src/lib/Makefile')).toBe('extension');
	});
});

describe('extensionOf / languageFor', () => {
	it('maps a file to its Monaco language', () => {
		expect(extensionOf('a/b/C.Svelte')).toBe('.svelte');
		expect(extensionOf('a/.hidden')).toBe('');
		expect(languageFor('src/routes/x/+page.svelte')).toBe('svelte');
		expect(languageFor('src/lib/a.ts')).toBe('typescript');
		expect(languageFor('src/lib/a.mjs')).toBe('javascript');
		expect(languageFor('src/lib/a.svg')).toBe('xml');
		expect(languageFor('src/lib/README')).toBe('plaintext');
	});
});

describe('importSpecifiersIn', () => {
	it('finds local specifiers with the ranges between the quotes', () => {
		const line = "\timport Block from '$lib/components/Block.svelte';";
		const [s] = importSpecifiersIn(line);
		expect(s.spec).toBe('$lib/components/Block.svelte');
		expect(line.slice(s.start, s.end)).toBe(s.spec);
	});

	it('handles from-lines, dynamic imports, raw imports and both quote kinds', () => {
		expect(importSpecifiersIn('} from "./scene";').map((s) => s.spec)).toEqual(['./scene']);
		expect(importSpecifiersIn("const m = await import('../x.ts');").map((s) => s.spec)).toEqual([
			'../x.ts'
		]);
		expect(
			importSpecifiersIn("import source from './+page.svelte?raw';").map((s) => s.spec)
		).toEqual(['./+page.svelte?raw']);
		expect(importSpecifiersIn("export { a } from '$lib';").map((s) => s.spec)).toEqual(['$lib']);
	});

	it('ignores packages, non-import lines, and template strings with ${', () => {
		expect(importSpecifiersIn("import { onMount } from 'svelte';")).toEqual([]);
		expect(importSpecifiersIn("const path = './not-an-import.ts';")).toEqual([]);
		expect(importSpecifiersIn('import(`./${name}.ts`)')).toEqual([]);
	});

	it('isLocalSpecifier', () => {
		expect(isLocalSpecifier('$lib')).toBe(true);
		expect(isLocalSpecifier('$libx/a')).toBe(false);
		expect(isLocalSpecifier('@geekpresent/core/draw')).toBe(false);
		expect(isLocalSpecifier('.hidden')).toBe(false);
	});
});

describe('importCandidates', () => {
	const FROM = 'src/routes/slides/a.html/+page.svelte';

	it('maps $lib onto src/lib', () => {
		expect(importCandidates('$lib/components/Block.svelte', FROM)).toEqual([
			'src/lib/components/Block.svelte'
		]);
	});

	it('resolves relative to the importing file, dropping ?raw and #hash', () => {
		expect(importCandidates('./+page.svelte?raw', FROM)).toEqual([
			'src/routes/slides/a.html/+page.svelte'
		]);
		expect(importCandidates('../pages.ts#x', FROM)).toEqual(['src/routes/slides/pages.ts']);
	});

	it('tries the usual suffixes for an extensionless import, .ts for a .js one', () => {
		expect(importCandidates('$lib/utils/drag', FROM)).toEqual([
			'src/lib/utils/drag.ts',
			'src/lib/utils/drag.js',
			'src/lib/utils/drag.svelte',
			'src/lib/utils/drag/index.ts',
			'src/lib/utils/drag/index.js'
		]);
		expect(importCandidates('./core.js', 'src/lib/x/y.ts')).toEqual([
			'src/lib/x/core.js',
			'src/lib/x/core.ts'
		]);
		expect(importCandidates('$lib', FROM)).toEqual(['src/lib/index.ts', 'src/lib/index.js']);
	});

	it('gives nothing for a package or a path out of the editable roots', () => {
		expect(importCandidates('svelte/store', FROM)).toEqual([]);
		expect(importCandidates('../../../../vite.config.ts', FROM)).toEqual([]);
		expect(importCandidates('../../../../../../etc/passwd', FROM)).toEqual([]);
		expect(importCandidates('./pic.png', FROM)).toEqual([]);
	});
});

describe('file tree', () => {
	const files = ['src/lib/b.ts', 'src/routes/x/+page.svelte', 'src/lib/A.ts', 'src/lib/utils/u.ts'];

	it('nests folders first, alphabetically', () => {
		const [src] = buildTree(files);
		expect(src.path).toBe('src');
		expect(src.children.map((c) => c.name)).toEqual(['lib', 'routes']);
		expect(src.children[0].children.map((c) => c.name)).toEqual(['utils', 'A.ts', 'b.ts']);
	});

	it('draws only the children of open folders', () => {
		const tree = buildTree(files);
		expect(visibleRows(tree, new Set()).map((r) => r.node.path)).toEqual(['src']);
		const rows = visibleRows(tree, new Set(['src', 'src/lib']));
		expect(rows.map((r) => `${r.depth}:${r.node.name}`)).toEqual([
			'0:src',
			'1:lib',
			'2:utils',
			'2:A.ts',
			'2:b.ts',
			'1:routes'
		]);
	});

	it('ancestorsOf / filterFiles', () => {
		expect(ancestorsOf('src/lib/utils/u.ts')).toEqual(['src', 'src/lib', 'src/lib/utils']);
		expect(filterFiles(files, 'LIB .ts')).toEqual([
			'src/lib/b.ts',
			'src/lib/A.ts',
			'src/lib/utils/u.ts'
		]);
		expect(filterFiles(files, '   ')).toEqual([]);
		expect(filterFiles(files, 'lib', 2)).toHaveLength(2);
	});
});

describe('ide session', () => {
	it('opens, focuses and closes tabs; a closed active tab hands over to a neighbour', () => {
		let s = openTab(openTab(openTab(emptySession(), 'a'), 'b'), 'c');
		expect(s.tabs).toEqual(['a', 'b', 'c']);
		s = openTab(s, 'a');
		expect(s).toMatchObject({ tabs: ['a', 'b', 'c'], active: 'a' });
		s = openTab(s, 'b');
		s = closeTab(s, 'b');
		expect(s).toMatchObject({ tabs: ['a', 'c'], active: 'c' });
		s = closeTab(s, 'c');
		expect(s.active).toBe('a');
		s = closeTab(s, 'a');
		expect(s).toMatchObject({ tabs: [], active: null });
	});

	it('keeps drafts only for open tabs, and drops one with its tab', () => {
		let s = openTab(emptySession(), 'a');
		s = setDraft(s, 'a', { content: 'x', fingerprint: 'f' });
		s = setDraft(s, 'ghost', { content: 'y', fingerprint: 'g' });
		expect(Object.keys(s.drafts)).toEqual(['a']);
		expect(setDraft(s, 'a', null).drafts).toEqual({});
		expect(closeTab(s, 'a').drafts).toEqual({});
	});

	it('round-trips, and parses junk to something usable', () => {
		const s = setDraft(openTab(openTab(emptySession(), 'a'), 'b'), 'b', {
			content: 'x',
			fingerprint: 'f'
		});
		expect(parseSession(encodeSession({ ...s, payloadTs: 7 }))).toEqual({ ...s, payloadTs: 7 });
		expect(parseSession('{not json')).toEqual(emptySession());
		expect(parseSession(null)).toEqual(emptySession());
		expect(
			parseSession({
				tabs: ['a', 'a', 3, '', 'b'],
				active: 'zzz',
				drafts: {
					a: { content: 1 },
					b: { content: 'ok', fingerprint: 'f' },
					z: { content: 'x', fingerprint: 'f' }
				},
				payloadTs: 'nope'
			})
		).toEqual({
			tabs: ['a', 'b'],
			active: 'a',
			drafts: { b: { content: 'ok', fingerprint: 'f' } },
			payloadTs: 0
		});
	});

	it('labels a tab by name, with its folder when two tabs share it', () => {
		const tabs = [
			'src/routes/a.html/+page.svelte',
			'src/routes/b.html/+page.svelte',
			'src/lib/x.ts'
		];
		expect(tabLabel(tabs[0], tabs)).toBe('a.html/+page.svelte');
		expect(tabLabel(tabs[2], tabs)).toBe('x.ts');
	});
});

describe('EDIT payload: file + line', () => {
	const base = {
		route: '/s/a.html',
		path: 'p',
		source: '',
		language: 'svelte',
		canSave: true,
		ts: 1
	};

	it('carries a file and a positive integer line', () => {
		expect(parseSourceEditPayload({ ...base, file: 'src/lib/a.ts', line: 12 })).toMatchObject({
			file: 'src/lib/a.ts',
			line: 12
		});
	});

	it('drops a bad line, and a line without a file', () => {
		expect(parseSourceEditPayload({ ...base, file: 'src/lib/a.ts', line: 0 })).not.toHaveProperty(
			'line'
		);
		expect(parseSourceEditPayload({ ...base, file: 'src/lib/a.ts', line: 1.5 })).not.toHaveProperty(
			'line'
		);
		expect(parseSourceEditPayload({ ...base, line: 3 })).not.toHaveProperty('line');
		expect(parseSourceEditPayload(base)).not.toHaveProperty('file');
	});
});
