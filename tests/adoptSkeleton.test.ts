// @vitest-environment node
//
// adopt-geekpresent.sh is the front door: it is the first GeekPresent code an adopter
// runs, and it runs exactly once, against THEIR repo. There is no second chance to get
// it right, and no way to notice it rotted — nothing here imports it, so a renamed route
// or a moved template breaks it silently and only in someone else's project.
//
// So we run the real script, on a fixture tree shaped like GeekPresent, and assert the
// tree it leaves behind. The fixture is deliberately NOT a git repo: the script tries
// `git clone file://…` for a local source and falls back to `cp -a`, so this exercises
// the copy path and stays hermetic and fast (no clone of this repo, no network).
//
// The invariant under test is the same for both trimming modes: the samples are MOVED,
// never deleted (`.samples-ref/` is gitignored but kept on disk — an agent reads it), and
// what remains must still build. Skeleton adds one thing: an empty deck in their place.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const REPO = process.cwd();
const SCRIPT = join(REPO, 'adopt-geekpresent.sh');

const workspaces: string[] = [];
afterAll(() => workspaces.forEach((w) => rmSync(w, { recursive: true, force: true })));

const write = (path: string, body: string) => {
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(path, body);
};

/** A tree with the handful of things the script actually reaches for: two decks (a deck
 *  IS a dir with a pages.ts), the standalone sample routes, the SEO route list, the
 *  landing page, the demo-coupled test — and the real skeleton template it copies. */
function fixtureSource(root: string) {
	const routes = join(root, 'src/routes');
	for (const deck of ['slides', 'animation']) {
		write(join(routes, deck, 'pages.ts'), `export const pages = [{ path: "demo.html" }];\n`);
		write(join(routes, deck, 'demo.html/+page.svelte'), `<h1>${deck} demo slide</h1>\n`);
	}
	write(join(routes, 'text.html/+page.svelte'), '<h1>text</h1>\n');
	write(join(routes, 'seo.html/+page.svelte'), '<h1>seo</h1>\n');
	write(join(routes, 'robots.txt/+server.ts'), 'export const GET = () => new Response("");\n');
	write(join(routes, '(home)/+page.svelte'), '<a href="/slides/demo.html">slides</a>\n');
	write(join(root, 'src/lib/seo/routes.ts'), `const TEXT_ROUTES = ['/', '/text.html'];\nexport { TEXT_ROUTES };\n`);
	write(join(root, 'tests/PathDemoSource.ssr.test.ts'), '// reads the demo slides\n');
	write(join(root, 'tests/Other.test.ts'), '// a framework test — must survive\n');
	write(join(root, '.gitignore'), '/docs/\n');
	// The skeleton the script copies is real source in this repo, not a heredoc — so the
	// fixture gets the genuine article, and this test fails if it ever goes missing.
	cpSync(join(REPO, 'utils/skeleton'), join(root, 'utils/skeleton'), { recursive: true });
}

/** Run the real script into a fresh host project; returns the adopted dir. */
function adopt(...flags: string[]): string {
	const work = mkdtempSync(join(tmpdir(), 'gp-adopt-'));
	workspaces.push(work);
	const source = join(work, 'source');
	const host = join(work, 'host');
	mkdirSync(source, { recursive: true });
	mkdirSync(host, { recursive: true });
	fixtureSource(source);

	execFileSync('bash', [SCRIPT, source, '--dir', 'gp', '--no-ci', '--no-build', '--yes', ...flags], {
		cwd: host, // the script adopts into $PWD/<dir>
		stdio: 'pipe'
	});
	return join(host, 'gp');
}

describe('adopt-geekpresent.sh --mode skeleton --kind deck', () => {
	const gp = adopt('--mode', 'skeleton', '--kind', 'deck', '--name', 'slides');
	const read = (p: string) => readFileSync(join(gp, p), 'utf8');

	it('scaffolds the empty deck — every file the deck shell needs, and nothing else', () => {
		// Deck-level shell + slide-level route. The two +layout.js files are the ones
		// people forget; without the slide's, its nav links 404 on the trailing-slash URL.
		for (const f of [
			'+layout.js',
			'+layout.svelte',
			'+page.svelte',
			'pages.ts',
			'title.html/+layout.js',
			'title.html/+page.svelte'
		]) {
			expect(existsSync(join(gp, 'src/routes/slides', f)), f).toBe(true);
		}
		expect(read('src/routes/slides/+layout.js')).toContain('trailingSlash = "always"');
		expect(read('src/routes/slides/title.html/+layout.js')).toContain('trailingSlash = "never"');
	});

	it('leaves NO sample slide behind — that is the whole point of the clean slate', () => {
		expect(existsSync(join(gp, 'src/routes/slides/demo.html'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/animation'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/text.html'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/seo.html'))).toBe(false);
	});

	it('moves the samples rather than deleting them — .samples-ref is the agent\'s reference', () => {
		expect(read('.samples-ref/slides/demo.html/+page.svelte')).toContain('slides demo slide');
		expect(read('.samples-ref/animation/demo.html/+page.svelte')).toContain('animation demo slide');
		expect(existsSync(join(gp, '.samples-ref/text.html'))).toBe(true);
		expect(read('.gitignore')).toContain('.samples-ref/');
	});

	it('keeps the framework: robots/sitemap routes, and the tests that are not about demos', () => {
		expect(existsSync(join(gp, 'src/routes/robots.txt'))).toBe(true);
		expect(existsSync(join(gp, 'tests/Other.test.ts'))).toBe(true);
	});

	// PathDemoSource asserts the <Path> DEMOS keep single-line tags — it reads slides that
	// this mode just moved, so left in place it fails on the adopter's first `pnpm test`.
	it('relocates the demo-coupled test with the demos it guards, so the suite starts green', () => {
		expect(existsSync(join(gp, 'tests/PathDemoSource.ssr.test.ts'))).toBe(false);
		expect(existsSync(join(gp, '.samples-ref/tests/PathDemoSource.ssr.test.ts'))).toBe(true);
	});

	it('points the landing page at the new deck, and trims the sitemap to what still exists', () => {
		expect(read('src/routes/(home)/+page.svelte')).toContain('{base}/slides/title.html');
		expect(read('src/lib/seo/routes.ts')).toContain(`const TEXT_ROUTES = ['/'];`);
	});

	// The terminal says all this once and scrolls away; the landing page is the copy an
	// adopter can still find. An unsubstituted __DECK__ would ship a dead link on the
	// first page they open, so that placeholder must not survive.
	it('makes the landing page the getting-started page, with the deck name substituted', () => {
		const home = read('src/routes/(home)/+page.svelte');
		expect(home).not.toContain('__DECK__');
		expect(home).toContain('src/routes/slides/pages.ts'); // how to add slide 2
		expect(home).toContain('.samples-ref/'); // where the component demos went
	});

	it("preserves the original landing page — it is moved, not lost", () => {
		expect(read('.samples-ref/home-+page.svelte.orig')).toContain('/slides/demo.html');
	});
});

// Adopting GeekPresent for a docs site rather than a talk: one long page that scrolls,
// no deck at all. The catch that makes this worth a test — a Text is NOT discovered by
// the sitemap's pages.ts glob (that finds decks). It reaches the sitemap only by being
// listed in TEXT_ROUTES, so a scaffold that forgets that line builds fine and is silently
// never indexed.
describe('adopt-geekpresent.sh --mode skeleton --kind text', () => {
	const gp = adopt('--mode', 'skeleton', '--kind', 'text', '--name', 'guide.html');
	const read = (p: string) => readFileSync(join(gp, p), 'utf8');

	it('scaffolds a Text route, and no deck', () => {
		for (const f of ['+layout.js', '+layout.svelte', '+page.svelte']) {
			expect(existsSync(join(gp, 'src/routes/guide.html', f)), f).toBe(true);
		}
		// A Text is a single route, addressed without a trailing slash — like a slide URL.
		expect(read('src/routes/guide.html/+layout.js')).toContain('trailingSlash = "never"');
		// No pages.ts: it is not a deck, and a stray one would make the sitemap glob treat it as one.
		expect(existsSync(join(gp, 'src/routes/guide.html/pages.ts'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/slides'))).toBe(false);
	});

	it('registers the Text in TEXT_ROUTES, or it would never reach the sitemap', () => {
		expect(read('src/lib/seo/routes.ts')).toContain(`const TEXT_ROUTES = ['/', '/guide.html'];`);
	});

	it('gives it a landing page that points at the page, not at a deck', () => {
		const home = read('src/routes/(home)/+page.svelte');
		expect(home).not.toContain('__NAME__');
		expect(home).toContain('{base}/guide.html');
		expect(home).not.toContain('title.html'); // there is no deck to send them to
	});
});

// The empty-handed case: the framework, and nothing authored. It builds — the site is
// just the landing page — but there is no deck and no worked example in the tree, so the
// landing page has to carry the whole recipe.
describe('adopt-geekpresent.sh --mode skeleton --kind none', () => {
	const gp = adopt('--mode', 'skeleton', '--kind', 'none');
	const read = (p: string) => readFileSync(join(gp, p), 'utf8');

	it('scaffolds nothing — src/routes keeps only the landing page and the SEO routes', () => {
		expect(existsSync(join(gp, 'src/routes/slides'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/guide.html'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/(home)'))).toBe(true);
		expect(existsSync(join(gp, 'src/routes/robots.txt'))).toBe(true);
		expect(read('src/lib/seo/routes.ts')).toContain(`const TEXT_ROUTES = ['/'];`);
	});

	// With nothing to click into, the landing page IS the documentation — and the thing
	// people get wrong is the two trailingSlash values, so it has to say both.
	it('the landing page spells out the files to write by hand', () => {
		const home = read('src/routes/(home)/+page.svelte');
		expect(home).toContain('trailingSlash = "always"'); // the deck
		expect(home).toContain('trailingSlash = "never"'); // each slide
		expect(home).toContain('TEXT_ROUTES'); // how a Text gets indexed
		// It must not link to a deck it did not create.
		expect(home).not.toContain('href=');
	});
});

// --kind and --name are PROMPTED when not passed; --yes takes the default. This pins what
// a human pressing Enter through the prompts gets, which is the most common path of all.
describe('adopt-geekpresent.sh --mode skeleton (defaults, as if you pressed Enter)', () => {
	const gp = adopt('--mode', 'skeleton');

	it('defaults to an empty deck named "slides"', () => {
		expect(existsSync(join(gp, 'src/routes/slides/title.html/+page.svelte'))).toBe(true);
	});
});

describe('adopt-geekpresent.sh argument checking', () => {
	it('rejects an unknown --kind rather than silently scaffolding nothing', () => {
		expect(() => adopt('--mode', 'skeleton', '--kind', 'slides')).toThrow(/kind/i);
	});
});

describe('adopt-geekpresent.sh --mode minimal (unchanged by the skeleton work)', () => {
	const gp = adopt('--mode', 'minimal', '--keep', 'slides');

	it('keeps the chosen deck verbatim and moves only the others', () => {
		// Verbatim: the kept deck is NOT replaced by the skeleton.
		expect(readFileSync(join(gp, 'src/routes/slides/demo.html/+page.svelte'), 'utf8')).toContain(
			'slides demo slide'
		);
		expect(existsSync(join(gp, 'src/routes/slides/title.html'))).toBe(false);
		expect(existsSync(join(gp, 'src/routes/animation'))).toBe(false);
		expect(existsSync(join(gp, '.samples-ref/animation'))).toBe(true);
	});

	// The getting-started page is skeleton's alone: it tells you how to write your FIRST
	// slide, which is the wrong advice for someone handed a deck full of working ones.
	it('keeps the two-line stub landing page, not the getting-started page', () => {
		const home = readFileSync(join(gp, 'src/routes/(home)/+page.svelte'), 'utf8');
		expect(home).toContain('{base}/slides/title.html');
		expect(home).not.toContain('Your deck is live');
	});
});

describe('adopt-geekpresent.sh --mode full', () => {
	const gp = adopt('--mode', 'full');

	it('touches nothing — every sample survives, no .samples-ref', () => {
		expect(existsSync(join(gp, 'src/routes/animation/demo.html'))).toBe(true);
		expect(existsSync(join(gp, 'src/routes/text.html'))).toBe(true);
		expect(existsSync(join(gp, 'tests/PathDemoSource.ssr.test.ts'))).toBe(true);
		expect(existsSync(join(gp, '.samples-ref'))).toBe(false);
	});
});
