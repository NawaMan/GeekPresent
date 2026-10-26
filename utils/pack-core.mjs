/*
  pack-core.mjs — build the @geekpresent/core tarball that a GitHub Release carries.

      node utils/pack-core.mjs                 # → .pack/geekpresent-core-<version>.tgz
      node utils/pack-core.mjs bump minor      # 0.3.1 → 0.4.0 in packages/core/package.json

  Run by `scripts/pack.sh` (in the booth) and by .github/workflows/release.yml (in CI).
  Nothing in the repo moves: `src/lib` is copied into a staging folder, `.pack/core/`, and
  packed from there. The package ships SOURCE — `.svelte` and `.ts` exactly as written —
  and the project's own Vite compiles it, as `$lib` is compiled here. Three things change
  on the way out, and each is a place where "inside this repo" and "inside a project" mean
  different things:

    1. `$lib/…` imports become RELATIVE. In a project, `$lib` is the project's own
       src/lib, so a framework file that said `$lib/presentation` would reach into the
       wrong folder. Only import specifiers are touched — never a string that merely
       mentions `$lib` (comments, or code the framework WRITES into a slide, which says
       `${base}/draw` and is the project's setting; see config/siteConfigCore.ts).
    2. The Vite plugin is compiled to `vite.js`. A project's vite.config.ts loads it with
       Node, which will not run TypeScript out of node_modules.
    3. The framework's route stubs (src/routes/_handout, _recorder, _source-edit,
       robots.txt, sitemap.xml) ship under `routes/`, their `$lib/` turned into
       `@geekpresent/core/`, for a project to copy into its own src/routes.

  It refuses to pack if any `$lib` import survives the rewrite: that file would build here
  and break in every project.
*/
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Files whose imports are rewritten. Everything else (images, fonts, .md) is copied as is. */
const CODE = /\.(ts|js|mjs|svelte|css)$/;

/** An import SPECIFIER: what follows `from`, a bare `import`, `import(` or CSS `@import`.
    Group 1 is the lead-in, 2 the quote, 3 the specifier. A `$lib` anywhere else — a comment,
    a string the code builds — does not match. */
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|@import\s+(?:url\(\s*)?)(['"])([^'"\n]*)\2/g;

/** The relative path from a file in the lib to `target` (a lib-relative path), POSIX style,
    always starting with `./` or `../` so it can never be read as a package name.

    @param {string} fromFile  lib-relative path of the importing file, e.g. "seo/routes.ts"
    @param {string} target    lib-relative path, e.g. "utils/navigate" ('' = the lib root)
    @returns {string} */
export function relativeSpecifier(fromFile, target) {
	const rel = posix.relative(posix.dirname(fromFile), target || '.');
	if (rel === '') return '.';
	return rel.startsWith('.') ? rel : `./${rel}`;
}

/** Rewrite every `$lib` import specifier in one file to a relative path.

    @param {string} source
    @param {string} file  lib-relative path of this file, e.g. "components/Box.svelte"
    @returns {{ source: string, count: number }} */
export function rewriteLibImports(source, file) {
	let count = 0;
	const out = source.replace(SPECIFIER, (whole, lead, q, spec) => {
		if (spec !== '$lib' && !spec.startsWith('$lib/')) return whole;
		count++;
		const target = spec === '$lib' ? 'index' : spec.slice('$lib/'.length);
		return `${lead}${q}${relativeSpecifier(file, target)}${q}`;
	});
	return { source: out, count };
}

/** Every `$lib` import specifier still in a source — what must be empty after rewriting.

    @param {string} source
    @returns {string[]} */
export function libImports(source) {
	const found = [];
	for (const m of source.matchAll(SPECIFIER)) {
		if (m[3] === '$lib' || m[3].startsWith('$lib/')) found.push(m[3]);
	}
	return found;
}

/** A route stub as a project needs it: `$lib/…` → `@geekpresent/core/…`.

    @param {string} source
    @returns {string} */
export function stubForProject(source) {
	return source.replace(SPECIFIER, (whole, lead, q, spec) =>
		spec.startsWith('$lib/') ? `${lead}${q}@geekpresent/core/${spec.slice(5)}${q}` : whole
	);
}

/** Exports for the modules a slide imports WITHOUT an extension — the way `$lib` is used
    everywhere: `@geekpresent/core/presentation` (presentation.ts) and
    `@geekpresent/core/draw` (draw/index.ts). An `exports` pattern ("./*") maps a path
    literally: Vite happens to try extensions after it, TypeScript does not, and neither
    looks for an index file. So every .ts/.js module, and every folder with an index, gets
    an exact entry. A file wins over a same-named folder, as it does for a relative import.

    @param {string[]} files  lib-relative paths
    @returns {Record<string, string>} e.g. { "./draw": "./src/draw/index.ts" } */
export function moduleExports(files) {
	const modules = [...files].filter((f) => /\.(ts|js)$/.test(f) && !/\.d\.ts$/.test(f)).sort();
	/** @type {Record<string, string>} */
	const out = {};
	for (const f of modules) {
		const stem = f.replace(/\.(ts|js)$/, '');
		if (stem !== 'index') out[`./${stem}`] = `./src/${f}`;
	}
	for (const f of modules) {
		const m = /^(.+)\/index\.(ts|js)$/.exec(f);
		if (m && !out[`./${m[1]}`]) out[`./${m[1]}`] = `./src/${f}`;
	}
	return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/** The `version.ts` a packed tarball carries: the released number as a literal. The repo's
    own version.ts reads packages/core/package.json, which is outside the package.

    @param {string} version  e.g. "0.1.0"
    @returns {string} */
export function versionModule(version) {
	return (
		'// Which GeekPresent this is. Written by utils/pack-core.mjs when the package was packed.\n' +
		`export const GEEKPRESENT_VERSION: string = ${JSON.stringify(String(version))};\n`
	);
}

/** The next version for a release. Plain MAJOR.MINOR.PATCH only — no pre-release tags,
    which a hand-pressed release button has no use for.

    @param {string} version  e.g. "0.3.1"
    @param {string} bump     "patch" | "minor" | "major"
    @returns {string}        e.g. "0.4.0" */
export function nextVersion(version, bump) {
	const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version ?? '').trim());
	if (!m) throw new Error(`not a MAJOR.MINOR.PATCH version: "${version}"`);
	const [major, minor, patch] = m.slice(1).map(Number);
	if (bump === 'major') return `${major + 1}.0.0`;
	if (bump === 'minor') return `${major}.${minor + 1}.0`;
	if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
	throw new Error(`bump must be patch, minor or major, not "${bump}"`);
}

/** The framework's routes: what a project copies into its own src/routes. */
export const FRAMEWORK_ROUTES = ['_handout', '_recorder', '_source-edit', 'robots.txt', 'sitemap.xml'];

/** All files under a directory, as paths relative to it (POSIX separators).
    @param {string} dir @returns {string[]} */
function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) for (const f of walk(full)) out.push(`${name}/${f}`);
		else out.push(name);
	}
	return out;
}

/** `bump <kind>`: write the next version into packages/core/package.json and print it.
    @param {string} root @param {string} kind */
function bumpVersion(root, kind) {
	const file = join(root, 'packages/core/package.json');
	const text = readFileSync(file, 'utf8');
	const { version } = JSON.parse(text);
	const next = nextVersion(version, kind);
	// A text edit, not a re-serialise, so the file's own formatting survives.
	writeFileSync(file, text.replace(`"version": "${version}"`, `"version": "${next}"`));
	console.log(next);
}

async function main() {
	const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
	if (process.argv[2] === 'bump') return bumpVersion(root, process.argv[3]);
	const lib = join(root, 'src/lib');
	const pkgDir = join(root, 'packages/core');
	const out = join(root, '.pack');
	const stage = join(out, 'core');

	rmSync(stage, { recursive: true, force: true });
	mkdirSync(stage, { recursive: true });

	// 1. src/lib → stage/src, $lib imports made relative.
	const leftovers = [];
	let rewritten = 0;
	for (const file of walk(lib)) {
		const to = join(stage, 'src', file);
		mkdirSync(dirname(to), { recursive: true });
		if (!CODE.test(file)) {
			cpSync(join(lib, file), to);
			continue;
		}
		const r = rewriteLibImports(readFileSync(join(lib, file), 'utf8'), file);
		rewritten += r.count;
		for (const spec of libImports(r.source)) leftovers.push(`${file}: ${spec}`);
		writeFileSync(to, r.source);
	}
	if (leftovers.length) {
		console.error(`pack-core: $lib imports survived the rewrite:\n  ${leftovers.join('\n  ')}`);
		process.exit(1);
	}

	// 1b. The released version, stamped over the repo's `-dev` reader (see src/lib/version.ts).
	const { version: stampVersion } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
	writeFileSync(join(stage, 'src/version.ts'), versionModule(stampVersion));

	// 2. The route stubs a project copies, pointed at the package.
	for (const route of FRAMEWORK_ROUTES) {
		const from = join(root, 'src/routes', route);
		for (const file of walk(from)) {
			const to = join(stage, 'routes', route, file);
			mkdirSync(dirname(to), { recursive: true });
			writeFileSync(to, stubForProject(readFileSync(join(from, file), 'utf8')));
		}
	}

	// 3. The Vite plugin, compiled. An SSR build bundles our own files and leaves every
	//    package (vite, svelte, node:*) external, which is what a config loaded by Node wants.
	const { build } = await import('vite');
	await build({
		configFile: false,
		logLevel: 'warn',
		root: stage,
		build: {
			ssr: join(stage, 'src/vite.ts'),
			outDir: stage,
			emptyOutDir: false,
			minify: false,
			rollupOptions: { output: { entryFileNames: 'vite.js', format: 'es' } }
		}
	});

	// 4. package.json (plus an exact export per extensionless module, ahead of the "./*"
	//    pattern that serves everything with an extension) and README, then pack.
	const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
	const { '.': dot, ...rest } = pkg.exports;
	pkg.exports = { '.': dot, ...moduleExports(walk(lib)), ...rest };
	writeFileSync(join(stage, 'package.json'), JSON.stringify(pkg, null, '\t') + '\n');
	if (existsSync(join(pkgDir, 'README.md'))) cpSync(join(pkgDir, 'README.md'), join(stage, 'README.md'));
	// The authoring guide for a project's AI agent: guide/README.md and one file per group of
	// components, read from node_modules so it always matches the installed version.
	cpSync(join(root, 'guide'), join(stage, 'guide'), { recursive: true });
	const { name, version } = pkg;
	execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: stage, stdio: 'inherit' });
	const tgz = `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
	console.log(`pack-core: ${rewritten} $lib imports made relative → ${relative(root, join(out, tgz)).split(sep).join('/')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
