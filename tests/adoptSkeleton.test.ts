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
//
// This runs the script with --yes, so it takes every default. The prompts a human answers
// on the way there are pinned separately, in adoptPrompt.test.ts.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { fixtureSource, SCRIPT } from './helpers/adoptFixture';

const workspaces: string[] = [];
afterAll(() => workspaces.forEach((w) => rmSync(w, { recursive: true, force: true })));

/** Run the real script into a fresh host project; returns the adopted dir. */
function adopt(...flags: string[]): string {
	const work = mkdtempSync(join(tmpdir(), 'gp-adopt-'));
	workspaces.push(work);
	const source = join(work, 'source');
	const host = join(work, 'host');
	mkdirSync(source, { recursive: true });
	mkdirSync(host, { recursive: true });
	fixtureSource(source);

	execFileSync('bash', [SCRIPT, source, '--dir', 'gp', '--no-ci', '--yes', ...flags], {
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

// The docs. A clone carries GeekPresent's own — and in an adopted repo most of them describe the
// wrong project. The generated README is the only thing in the tree that tells a human "this is
// yours, here is YOUR build command"; before it, that existed only in terminal output that scrolls
// away. Everything upstream is MOVED, not deleted: GeekPresent's README stays readable as the
// framework's introduction and reference, it just stops pretending to be the adopter's README.
describe('adopt-geekpresent.sh — docs', () => {
	const gp = adopt('--mode', 'skeleton', '--kind', 'deck', '--name', 'talks');
	const read = (p: string) => readFileSync(join(gp, p), 'utf8');

	// The footgun. /pick-todo says "propose features from TODO.md, then build the one they pick" —
	// and the TODO.md that ships is GeekPresent's FRAMEWORK backlog. Left in place, an adopter's
	// agent will offer to implement the framework's roadmap into their slide deck.
	it('disarms the TODO skills — they aim an agent at the framework backlog', () => {
		expect(existsSync(join(gp, '.claude/skills/pick-todo'))).toBe(false);
		expect(existsSync(join(gp, '.claude/skills/todo'))).toBe(false);
		expect(existsSync(join(gp, 'TODO.md'))).toBe(false);
		// Moved, not deleted — the rule the sample decks already follow.
		expect(existsSync(join(gp, '.samples-ref/claude-skills/pick-todo'))).toBe(true);
		expect(existsSync(join(gp, '.samples-ref/TODO.md'))).toBe(true);
	});

	it('keeps the skills that are actually about authoring', () => {
		expect(existsSync(join(gp, '.claude/skills/new-slide'))).toBe(true);
	});

	// AGENTS.md is the AUTHORING manual — the one document an adopter's agent most needs. AGENT.md
	// is the ADOPTION manual, and by the time you can read it there, that job is done.
	it('keeps AGENTS.md, retires AGENT.md', () => {
		expect(existsSync(join(gp, 'AGENTS.md'))).toBe(true);
		expect(existsSync(join(gp, 'AGENT.md'))).toBe(false);
		expect(existsSync(join(gp, '.samples-ref/AGENT.md'))).toBe(true);
	});

	it("preserves GeekPresent's own README — still the framework's introduction, just not yours", () => {
		expect(read('.samples-ref/GeekPresent-README.md')).toContain('# GeekPresent');
	});

	// The point of generating it rather than shipping a static one: it can name the deck you chose
	// and the command that actually works for the environment and output folder you picked.
	it('writes a README about YOUR project, with YOUR build command', () => {
		const readme = read('README.md');
		expect(readme).not.toContain('__DIR__');
		expect(readme).not.toContain('__NAME__');
		expect(readme).toContain('src/routes/talks/'); // the deck they named
		expect(readme).toContain('./booth -- ./build-static.sh dist'); // booth kept, output inside
		expect(readme).toContain('gp/dist/'); // where the site lands
		expect(readme).toContain('.samples-ref/GeekPresent-README.md'); // the way back to the framework docs
	});

	// '&' means "the whole match" to sed, and the host build command is full of '&&'.
	it('does not mangle && in the build command it bakes in', () => {
		const host = adopt('--mode', 'skeleton', '--no-booth');
		expect(readFileSync(join(host, 'README.md'), 'utf8')).toContain(
			'pnpm install && ./build-static.sh dist'
		);
	});

	it('matches the advice to what was scaffolded', () => {
		const text = adopt('--mode', 'skeleton', '--kind', 'text', '--name', 'guide.html');
		expect(readFileSync(join(text, 'README.md'), 'utf8')).toContain('TEXT_ROUTES');

		const none = adopt('--mode', 'skeleton', '--kind', 'none');
		expect(readFileSync(join(none, 'README.md'), 'utf8')).toContain("trailingSlash = 'always'");
	});
});

// Full means full: the upstream docs stay, because that adopter asked for everything. But the TODO
// skills are a live hazard, so the script says so out loud rather than leaving it to be discovered.
describe('adopt-geekpresent.sh --mode full — docs', () => {
	const gp = adopt('--mode', 'full');

	it('keeps the upstream docs — full means full, and it warns rather than prunes', () => {
		expect(existsSync(join(gp, 'TODO.md'))).toBe(true);
		expect(existsSync(join(gp, 'README.md'))).toBe(true);
		expect(existsSync(join(gp, '.claude/skills/pick-todo'))).toBe(true);
		expect(existsSync(join(gp, '.samples-ref'))).toBe(false);
	});
});

// The build environment. GeekPresent tracks its own CodingBooth (`booth` + `.booth/`), so a
// clone carries a working container along with it — the script's job is to make that a
// decision rather than a stowaway. Flags here; the prompt is pinned in adoptPrompt.test.ts.
describe('adopt-geekpresent.sh --no-booth', () => {
	const gp = adopt('--mode', 'skeleton', '--no-booth');

	it('removes the wrapper AND its config — a half-removed booth is a broken one', () => {
		expect(existsSync(join(gp, 'booth'))).toBe(false);
		expect(existsSync(join(gp, '.booth'))).toBe(false);
	});

	// Removing the booth is a two-path delete and nothing more: it is not a licence to go
	// tidying up after it. Whatever else the adopter gets, they get for reasons unrelated
	// to the container they declined.
	it('deletes those two paths and nothing else', () => {
		const kept = adopt('--mode', 'skeleton'); // the same run, booth and all
		const diff = (dir: string) =>
			execFileSync('find', ['.', '-not', '-path', './node_modules/*'], { cwd: dir, encoding: 'utf8' })
				.split('\n')
				.filter(Boolean)
				.sort();
		const removed = diff(kept).filter((p) => !diff(gp).includes(p));
		expect(removed.filter((p) => !p.startsWith('./.booth') && p !== './booth')).toEqual([]);
	});

	it('leaves the framework alone — this is a choice about environment, not content', () => {
		expect(existsSync(join(gp, 'src/routes/slides/title.html/+page.svelte'))).toBe(true);
	});
});

describe('adopt-geekpresent.sh (booth is the default)', () => {
	const gp = adopt('--mode', 'skeleton');

	// Used as it comes: the same wrapper and the same pinned config GeekPresent builds with.
	// The script's only jobs are to keep it and to say so.
	it('keeps the booth the clone brought, byte for byte', () => {
		expect(readFileSync(join(gp, '.booth/Boothfile'), 'utf8')).toContain('setup nodejs 22');
		expect(existsSync(join(gp, 'booth'))).toBe(true);
	});
});

// The output folder. One answer has to satisfy three consumers — the local build, the
// verification build and the CI upload — and before it was asked, they disagreed: CI
// hardcoded $DIR/docs while build-static.sh wrote wherever you pointed it.
describe('adopt-geekpresent.sh --dist', () => {
	const workflow = (gp: string) => readFileSync(join(gp, '../.github/workflows/deploy-gp.yml'), 'utf8');

	it('teaches CI to build where you said, instead of its own hardcoded folder', () => {
		const gp = adopt('--mode', 'skeleton', '--ci');
		expect(workflow(gp)).toContain('GEEKPRESENT_OUT: "dist"');
		expect(workflow(gp)).toContain('path: gp/dist');
	});

	// You answer from the repo root ('site'), but the two consumers stand in different places:
	// the builder runs INSIDE gp/ (so '../site'), while upload-pages-artifact names it from the
	// root ('site'). Same folder, two spellings — emit the wrong one and CI deploys an empty
	// directory, which is the kind of failure that looks like a success.
	it("translates 'site' per consumer: ../site to the builder, site/ to the uploader", () => {
		const gp = adopt('--mode', 'skeleton', '--dist', 'site', '--ci');
		expect(workflow(gp)).toContain('GEEKPRESENT_OUT: "../site"');
		expect(workflow(gp)).toContain('path: site');
	});

	it('refuses an output that resolves to the repo root — that is not a folder, that is your repo', () => {
		expect(() => adopt('--mode', 'skeleton', '--dist', '.')).toThrow(/repo root/i);
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
