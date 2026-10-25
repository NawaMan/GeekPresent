// Unit tests for the package builder (utils/pack-core.mjs).
//
// It rewrites framework SOURCE on its way into the tarball, so — like wire-og and
// patchSource — the tests care as much about what it leaves alone as what it changes:
// only real import specifiers move; a `$lib` in a comment, or in code that writes an
// import INTO a slide, must come through untouched.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	FRAMEWORK_ROUTES,
	libImports,
	moduleExports,
	nextVersion,
	relativeSpecifier,
	rewriteLibImports,
	stubForProject
} from '../utils/pack-core.mjs';

describe('relativeSpecifier', () => {
	it('walks out of the importing file’s folder', () => {
		expect(relativeSpecifier('seo/routes.ts', 'utils/navigate')).toBe('../utils/navigate');
		expect(relativeSpecifier('components/Box.svelte', 'components/Hint.svelte')).toBe('./Hint.svelte');
		expect(relativeSpecifier('presentation.ts', 'utils/progressCore')).toBe('./utils/progressCore');
	});

	it('never yields a bare name, which would read as a package', () => {
		expect(relativeSpecifier('a/b.ts', 'a')).toBe('.');
		expect(relativeSpecifier('x.ts', 'index')).toBe('./index');
	});
});

describe('rewriteLibImports', () => {
	const rw = (src: string, file = 'components/X.svelte') => rewriteLibImports(src, file);

	it('rewrites every import form', () => {
		const src = [
			"import Box from '$lib/components/Box.svelte';",
			'import { pages } from "$lib/presentation";',
			"export type { Progress } from '$lib/utils/progressCore';",
			"import '$lib/themes/roles.css';",
			"const m = await import('$lib/draw/types');",
			"export let e: import('$lib/draw/types').DrawOnEditor;",
			"@import '$lib/styles/note.css';"
		].join('\n');
		const { source, count } = rw(src);
		expect(count).toBe(7);
		expect(libImports(source)).toEqual([]);
		expect(source).toContain("import Box from './Box.svelte';");
		expect(source).toContain('import { pages } from "../presentation";');
		expect(source).toContain("from '../utils/progressCore'");
		expect(source).toContain("import '../themes/roles.css';");
		expect(source).toContain("import('../draw/types')");
		expect(source).toContain("@import '../styles/note.css';");
	});

	it('leaves comments and generated code alone', () => {
		const src = [
			'// All logic lives in `$lib/utils/linkCore.ts`.',
			'/** The `$lib/draw` names a set of tags needs. */',
			"const line = `import { ${names} } from '${from}';`;",
			"const old = 'see $lib/draw for shapes';"
		].join('\n');
		const { source, count } = rw(src);
		expect(count).toBe(0);
		expect(source).toBe(src);
	});

	it('does not touch other packages or relative imports', () => {
		const src = "import { writable } from 'svelte/store';\nimport x from './x';\nimport y from '$app/environment';";
		expect(rw(src)).toEqual({ source: src, count: 0 });
	});
});

describe('nextVersion — the release button’s bump', () => {
	it('bumps one part and zeroes the parts below it', () => {
		expect(nextVersion('0.3.1', 'patch')).toBe('0.3.2');
		expect(nextVersion('0.3.1', 'minor')).toBe('0.4.0');
		expect(nextVersion('0.3.1', 'major')).toBe('1.0.0');
	});

	it('refuses what it cannot bump rather than guessing', () => {
		expect(() => nextVersion('1.2', 'patch')).toThrow(/MAJOR.MINOR.PATCH/);
		expect(() => nextVersion('1.2.3-beta', 'patch')).toThrow(/MAJOR.MINOR.PATCH/);
		expect(() => nextVersion('1.2.3', 'huge')).toThrow(/patch, minor or major/);
	});
});

describe('stubForProject', () => {
	it('points a route stub at the package', () => {
		const stub = "export { prerender, GET } from '$lib/framework/robots';\n// see $lib/framework\n";
		expect(stubForProject(stub)).toBe(
			"export { prerender, GET } from '@geekpresent/core/framework/robots';\n// see $lib/framework\n"
		);
	});
});

describe('moduleExports', () => {
	it('gives every extensionless module and index folder an exact entry', () => {
		const ex = moduleExports([
			'presentation.ts',
			'draw/index.ts',
			'draw/Rect.svelte',
			'draw/types.ts',
			'index.ts',
			'types/thing.d.ts',
			'styles/global.css'
		]);
		expect(ex).toEqual({
			'./draw': './src/draw/index.ts',
			'./draw/index': './src/draw/index.ts',
			'./draw/types': './src/draw/types.ts',
			'./presentation': './src/presentation.ts'
		});
	});

	it('prefers a file over a same-named folder, as a relative import does', () => {
		expect(moduleExports(['a.ts', 'a/index.ts'])['./a']).toBe('./src/a.ts');
	});
});

// The whole of src/lib must survive the rewrite: a `$lib` import left behind builds here
// and breaks in every project that installs the package.
describe('src/lib, as it would be packed', () => {
	const lib = join(__dirname, '../src/lib');
	const walk = (dir: string): string[] =>
		readdirSync(dir).flatMap((n) => {
			const full = join(dir, n);
			return statSync(full).isDirectory() ? walk(full).map((f) => `${n}/${f}`) : [n];
		});

	it('has no $lib import that the rewrite misses', () => {
		const left: string[] = [];
		for (const f of walk(lib).filter((f) => /\.(ts|js|svelte|css)$/.test(f))) {
			const { source } = rewriteLibImports(readFileSync(join(lib, f), 'utf8'), f);
			for (const spec of libImports(source)) left.push(`${f}: ${spec}`);
		}
		expect(left).toEqual([]);
	});

	it('keeps the framework routes thin: each stub only re-exports from $lib/framework', () => {
		const routes = join(__dirname, '../src/routes');
		for (const route of FRAMEWORK_ROUTES) {
			for (const f of walk(join(routes, route))) {
				const src = readFileSync(join(routes, route, f), 'utf8');
				expect(src.split('\n').length, `${route}/${f}`).toBeLessThan(15);
				const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
				for (const spec of imports) expect(spec, `${route}/${f}`).toMatch(/^\$lib\/framework\//);
			}
		}
	});
});
