// The tree adopt-geekpresent.sh is run against, shared by the two tests that run the real
// script (adoptSkeleton = what it builds, adoptPrompt = what it asks). One fixture, so the
// two can't drift into disagreeing about the shape of GeekPresent.
//
// It is deliberately NOT a git repo: for a local source the script tries `git clone file://…`
// and falls back to `cp -a`, so this exercises the copy path and stays hermetic and fast
// (no clone of this repo, no network).
import { chmodSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = process.cwd();
export const SCRIPT = join(REPO, 'adopt-geekpresent.sh');

const write = (path: string, body: string) => {
	mkdirSync(join(path, '..'), { recursive: true });
	writeFileSync(path, body);
};

/** The handful of things the script actually reaches for: two decks (a deck IS a dir with
 *  a pages.ts), the standalone sample routes, the SEO route list, the landing page, the
 *  demo-coupled test — and the real skeleton template it copies. */
export function fixtureSource(root: string) {
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
	// GeekPresent's own docs, which travel with the clone. In an adopted repo most of them are
	// about the wrong project — and the two TODO skills read TODO.md, i.e. the FRAMEWORK's
	// backlog, so they would happily aim an adopter's agent at building GeekPresent.
	write(join(root, 'README.md'), '# GeekPresent\n\nA copy-and-own deck framework.\n');
	write(join(root, 'AGENT.md'), '# AGENT.md — Adopting GeekPresent into a project\n');
	write(join(root, 'AGENTS.md'), '# AGENTS.md — authoring guide\n'); // the one that must SURVIVE
	write(join(root, 'TODO.md'), '# TODO\n\n- [ ] a GeekPresent framework feature\n');
	for (const skill of ['todo', 'pick-todo', 'new-slide']) {
		write(join(root, `.claude/skills/${skill}/SKILL.md`), `---\nname: ${skill}\n---\n`);
	}
	// GeekPresent tracks its CodingBooth, so a clone hands one to the adopter whether they
	// asked or not — which is exactly why the script now asks. Executable, because that is
	// how the script decides a booth is really there.
	write(join(root, 'booth'), '#!/bin/sh\necho "booth stub"\n');
	chmodSync(join(root, 'booth'), 0o755);
	write(join(root, '.booth/Boothfile'), '# syntax=codingbooth/boothfile:1\nsetup nodejs 22\n');
	write(join(root, '.booth/config.toml'), 'variant = "base"\nport = "31000"\n');
	// The skeleton the script copies is real source in this repo, not a heredoc — so the
	// fixture gets the genuine article, and these tests fail if it ever goes missing.
	cpSync(join(REPO, 'utils/skeleton'), join(root, 'utils/skeleton'), { recursive: true });
}
