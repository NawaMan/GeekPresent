// @vitest-environment node
//
// adopt-geekpresent.sh --package: a GeekPresent site in a subfolder of someone's repo, with the
// framework as a dependency. It is made from GeekPresentStarter, so what is pinned here is what
// the script does TO the Starter: the folder the build writes, the address it builds for, what
// it scaffolds per --kind, and what it leaves out because it is about the template rather than
// the site. Run against a Starter-shaped fixture (helpers/adoptFixture.ts), hermetic and fast.
//
// What the fixture cannot prove is that the result builds: that needs the real Starter, its
// dependencies and a booth. It was checked by hand when --package landed (deck, text and blog;
// scripts/test.sh and scripts/build.sh in the generated folder).
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { fixtureSource, fixtureStarter, SCRIPT } from './helpers/adoptFixture';

const workspaces: string[] = [];
afterAll(() => workspaces.forEach((w) => rmSync(w, { recursive: true, force: true })));

function workspace() {
	const work = mkdtempSync(join(tmpdir(), 'gp-package-'));
	workspaces.push(work);
	const starter = join(work, 'starter');
	const host = join(work, 'host');
	mkdirSync(starter, { recursive: true });
	mkdirSync(host, { recursive: true });
	fixtureStarter(starter);
	return { work, starter, host };
}

/** Run --package --yes into a fresh host project; returns the host dir and a reader. */
function adopt(...flags: string[]) {
	const { starter, host } = workspace();
	execFileSync('bash', [SCRIPT, starter, '--package', '--dir', 'site-src', '--no-ci', '--yes', ...flags], {
		cwd: host,
		stdio: 'pipe'
	});
	const dir = join(host, 'site-src');
	return {
		host,
		dir,
		read: (p: string) => readFileSync(join(dir, p), 'utf8'),
		has: (p: string) => existsSync(join(dir, p))
	};
}

describe('adopt-geekpresent.sh --package — the defaults', () => {
	const site = adopt();

	it('makes a deck from the Starter, with the framework as a dependency', () => {
		expect(site.has('src/routes/slides/title.html/+page.svelte')).toBe(true);
		expect(site.read('package.json')).toContain('@geekpresent/core');
		expect(site.read('package.json')).toContain('"name": "site-src"');
	});

	it('builds into build/ inside the folder, at the domain root', () => {
		expect(site.read('svelte.config.js')).toContain("GEEKPRESENT_OUT || 'build'");
		expect(site.read('svelte.config.js')).toContain("GEEKPRESENT_BASE_PATH || ''");
	});

	it("leaves out what is about the template: its CI, licence and README", () => {
		expect(site.has('.github')).toBe(false);
		expect(site.has('LICENSE')).toBe(false);
		expect(site.read('README.md')).toContain('# site-src');
		expect(site.read('README.md')).not.toContain('GeekPresent Starter');
	});

	it("keeps the agent's manual and the booth", () => {
		expect(site.has('AGENTS.md')).toBe(true);
		expect(site.has('booth')).toBe(true);
	});
});

describe('adopt-geekpresent.sh --package --kind deck --name', () => {
	const site = adopt('--kind', 'deck', '--name', 'talk');

	it('renames the deck, its landing-page link and its test', () => {
		expect(site.has('src/routes/talk/title.html/+page.svelte')).toBe(true);
		expect(site.has('src/routes/slides')).toBe(false);
		expect(site.read('src/routes/(home)/+page.svelte')).toContain('{base}/talk/title.html');
		expect(site.has('tests/slides.ssr.test.ts')).toBe(false);
		expect(site.read('tests/talk.ssr.test.ts')).toContain("'../src/routes/talk/title.html/+page.svelte'");
	});
});

describe('adopt-geekpresent.sh --package --kind text', () => {
	const site = adopt('--kind', 'text');

	it('makes the root page the page, and drops the sample deck and its test', () => {
		expect(site.read('src/routes/(home)/+page.svelte')).toContain('<h1>My Page</h1>');
		expect(site.read('src/routes/(home)/+layout.svelte')).toContain('TextPage');
		expect(site.has('src/routes/slides')).toBe(false);
		expect(site.has('tests/slides.ssr.test.ts')).toBe(false);
		expect(site.has('tests/page.ssr.test.ts')).toBe(true);
	});
});

describe('adopt-geekpresent.sh --package --kind blog', () => {
	const site = adopt('--kind', 'blog');

	it('writes an index at / that lists the first post', () => {
		const index = site.read('src/routes/(home)/+page.svelte');
		expect(index).toContain("path: 'hello-world.html'");
		expect(index).toContain('{base}/{post.path}');
		expect(index).toMatch(/date: '\d{4}-\d{2}-\d{2}'/);
	});

	it('writes the first post as a page of its own, with both route files', () => {
		expect(site.read('src/routes/hello-world.html/+layout.js')).toContain('trailingSlash = "never"');
		expect(site.read('src/routes/hello-world.html/+layout.svelte')).toContain('type="article"');
		expect(site.read('src/routes/hello-world.html/+page.svelte')).toContain('<h1>Hello, world</h1>');
	});

	it('lists both pages for the sitemap, and tests them instead of the dropped deck', () => {
		expect(site.read('geekpresent.config.ts')).toContain("textRoutes: ['/', '/hello-world.html']");
		expect(site.has('src/routes/slides')).toBe(false);
		expect(site.read('tests/blog.ssr.test.ts')).toContain('hello-world.html/+page.svelte');
	});

	it('says how to add a post', () => {
		expect(site.read('README.md')).toContain('Add a post');
	});
});

// The CodingBooth shape: the blog's source in blog/, built into site/blog/ of a hand-written
// site that is committed and served at https://example.com/blog.
describe('adopt-geekpresent.sh --package — a blog built into an existing site', () => {
	const site = adopt('--dir', 'blog', '--kind', 'blog', '--dist', 'site/blog', '--site-url', 'https://example.com/blog');
	// --dir comes after the helper's own, so it wins.
	const blog = (p: string) => readFileSync(join(site.host, 'blog', p), 'utf8');

	it('builds into the site folder beside the source', () => {
		expect(blog('svelte.config.js')).toContain("GEEKPRESENT_OUT || '../site/blog'");
	});

	it('takes the base path from the address, and writes both into the source', () => {
		expect(blog('svelte.config.js')).toContain("GEEKPRESENT_BASE_PATH || '/blog'");
		expect(blog('geekpresent.config.ts')).toContain("siteUrl: 'https://example.com/blog'");
	});

	it('builds on the host, since the booth cannot reach an output outside the folder', () => {
		expect(blog('README.md')).toContain('NO_BOOTH=1 scripts/build.sh');
	});
});

describe('adopt-geekpresent.sh --package --ci', () => {
	const site = adopt('--ci', '--site-url', 'https://you.github.io/my-repo');
	const workflow = readFileSync(join(site.host, '.github/workflows/deploy-site-src.yml'), 'utf8');

	it('builds the subfolder and uploads its output, hidden files included', () => {
		expect(workflow).toContain('working-directory: site-src');
		expect(workflow).toContain('GEEKPRESENT_OUT: "build"');
		expect(workflow).toContain('path: site-src/build');
		expect(workflow).toContain('include-hidden-files: true');
	});

	it("uses the Starter's pnpm and node", () => {
		expect(workflow).toMatch(/version: 12\n/);
		expect(workflow).toContain('node-version: 24');
	});

	it('bakes the base path into the source rather than the workflow', () => {
		expect(site.read('svelte.config.js')).toContain("GEEKPRESENT_BASE_PATH || '/my-repo'");
	});
});

describe('adopt-geekpresent.sh --package --no-booth', () => {
	const site = adopt('--no-booth');

	it('removes the booth and says to install with your own pnpm', () => {
		expect(site.has('booth')).toBe(false);
		expect(site.has('.booth')).toBe(false);
		expect(site.read('README.md')).toContain('scripts/install.sh && scripts/dev.sh');
	});
});

describe('adopt-geekpresent.sh — choosing package or copy', () => {
	it('refuses a --copy flag with --package', () => {
		const { starter, host } = workspace();
		const run = spawnSync('bash', [SCRIPT, starter, '--package', '--mode', 'skeleton', '--yes'], {
			cwd: host,
			encoding: 'utf8'
		});
		expect(run.status).not.toBe(0);
		expect(run.stderr).toMatch(/--mode is for --copy/);
	});

	it('refuses a blog with --copy', () => {
		const { starter, host } = workspace();
		const run = spawnSync('bash', [SCRIPT, starter, '--copy', '--kind', 'blog', '--yes'], {
			cwd: host,
			encoding: 'utf8'
		});
		expect(run.status).not.toBe(0);
		expect(run.stderr).toMatch(/needs --package/);
	});

	it('reads --mode as the copy route, so older invocations still work', () => {
		const { work, host } = workspace();
		const source = join(work, 'gp-source');
		mkdirSync(source);
		fixtureSource(source);
		execFileSync('bash', [SCRIPT, source, '--dir', 'gp', '--mode', 'skeleton', '--no-ci', '--yes'], {
			cwd: host,
			stdio: 'pipe'
		});
		expect(existsSync(join(host, 'gp/utils/skeleton'))).toBe(true); // the framework source
	});

	it('asks a bare run, and Enter takes the package', () => {
		const { work, starter, host } = workspace();
		const tty = join(work, 'keystrokes');
		writeFileSync(tty, '\n'.repeat(20)); // Enter at every prompt
		const run = spawnSync('bash', [SCRIPT, starter, '--dir', 'gp', '--no-ci'], {
			cwd: host,
			encoding: 'utf8',
			env: { ...process.env, GP_TTY: tty }
		});
		expect(run.stderr).toContain('[Pc]');
		expect(run.status).toBe(0);
		expect(readFileSync(join(host, 'gp/package.json'), 'utf8')).toContain('@geekpresent/core');
	});

	it('refuses a template that is not GeekPresentStarter', () => {
		const { work, host } = workspace();
		const other = join(work, 'other');
		mkdirSync(other);
		writeFileSync(join(other, 'package.json'), '{ "name": "x" }\n');
		const run = spawnSync('bash', [SCRIPT, other, '--package', '--dir', 'gp', '--no-ci', '--yes'], {
			cwd: host,
			encoding: 'utf8'
		});
		expect(run.status).not.toBe(0);
		expect(run.stderr).toMatch(/does not look like GeekPresentStarter/);
	});
});
