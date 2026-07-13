// @vitest-environment node
//
// The prompts, as a human actually meets them. adopt-geekpresent.sh is interactive by
// default — most adopters never pass a single flag, they just answer six questions — so
// the prompt layer is the most-used code in the script and, until now, the only part with
// no test: every other test here passes --yes and takes the defaults.
//
// What makes it testable is that the script reads its prompts from $GP_TTY (default
// /dev/tty) rather than stdin — stdin is the script itself under `curl | bash`. So we
// hand it a FILE of keystrokes and read back the tree it built. What we are pinning is
// the mapping from a keystroke to a decision: 's' must mean skeleton, and Enter must mean
// the letter shown capitalised in the hint. Get that wrong and someone who typed 'f'
// silently gets a different project than the one they asked for.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { fixtureSource, SCRIPT } from './helpers/adoptFixture';

const workspaces: string[] = [];
afterAll(() => workspaces.forEach((w) => rmSync(w, { recursive: true, force: true })));

type Prompt = 'dir' | 'mode' | 'kind' | 'name' | 'base' | 'dist' | 'env' | 'proceed';
type Keys = Partial<Record<Prompt, string>>;

/** The questions asked, in order, for `SOURCE --dir gp --no-ci` — which depends
 *  on the answers, because the script BRANCHES: skeleton asks what to scaffold and (unless
 *  that is 'none') what to call it, minimal asks only which deck to keep, full asks neither.
 *
 *  A reply is positional — the script reads lines, it does not read labels — so getting this
 *  wrong doesn't fail loudly, it just slides every later answer onto the wrong question. That
 *  is worth modelling explicitly rather than padding with blanks and hoping. */
function promptOrder(keys: Keys): Prompt[] {
	const mode = keys.mode ?? '';
	const is = (...answers: string[]) => answers.includes(mode);
	const order: Prompt[] = ['dir', 'mode'];
	if (is('s', 'e', 'skeleton')) {
		order.push('kind');
		const kind = keys.kind ?? '';
		if (!['n', 'none'].includes(kind)) order.push('name'); // 'none' scaffolds nothing to name
	} else if (!is('f', 'full')) {
		order.push('name'); // minimal: which deck to keep
	}
	order.push('base', 'dist', 'env', 'proceed');
	return order;
}

/** Run the script as a human would: keystrokes, not flags. `keys` maps a prompt to what gets
 *  typed; anything unlisted is a bare Enter — i.e. take the default. `raw` bypasses the model
 *  above for the one test that needs to: a rejected answer re-asks, which consumes a line the
 *  prompt order can't predict. */
function typeAtPrompts(keys: Keys, raw?: string[]) {
	const work = mkdtempSync(join(tmpdir(), 'gp-prompt-'));
	workspaces.push(work);
	const source = join(work, 'source');
	const host = join(work, 'host');
	mkdirSync(source, { recursive: true });
	mkdirSync(host, { recursive: true });
	fixtureSource(source);

	// A regular file standing in for the terminal. The script opens it once and keeps the
	// offset, so these are consumed in order, exactly like typing them. A read past EOF is an
	// empty reply, which is the default — which is what Enter does anyway.
	const lines = raw ?? promptOrder(keys).map((p) => keys[p] ?? '');
	const tty = join(work, 'keystrokes');
	writeFileSync(tty, lines.map((l) => `${l}\n`).join(''));

	const run = spawnSync('bash', [SCRIPT, source, '--dir', 'gp', '--no-ci'], {
		cwd: host,
		encoding: 'utf8',
		env: { ...process.env, GP_TTY: tty }
	});
	return { dir: join(host, 'gp'), stderr: run.stderr, status: run.status };
}

const routes = (dir: string) => (p: string) => existsSync(join(dir, 'src/routes', p));

describe('the samples prompt — [Msf]', () => {
	// The hint IS the documentation: three letters, and the capital says which one Enter
	// gives you. If it stops reading "[Msf]" the prompt has stopped explaining itself.
	it('offers one letter per mode, with the default capitalised', () => {
		const { stderr } = typeAtPrompts({});
		expect(stderr).toContain('[Msf]');
	});

	it("'s' scaffolds the skeleton", () => {
		const { dir } = typeAtPrompts({ mode: 's' });
		expect(routes(dir)('slides/title.html/+page.svelte')).toBe(true); // the empty deck
		expect(routes(dir)('slides/demo.html')).toBe(false); // and no sample slide
	});

	// 'e' for empty. Nobody reading "[Msf]" will type it, but plenty of people think of
	// this mode as "the empty one" and reach for the letter that word starts with.
	it("'e' means the same thing — the empty one", () => {
		const { dir } = typeAtPrompts({ mode: 'e' });
		expect(routes(dir)('slides/title.html/+page.svelte')).toBe(true);
	});

	it('still takes the whole word, so the prompt and --mode never drift apart', () => {
		const { dir } = typeAtPrompts({ mode: 'skeleton' });
		expect(routes(dir)('slides/title.html/+page.svelte')).toBe(true);
	});

	it("'f' keeps every sample", () => {
		const { dir } = typeAtPrompts({ mode: 'f' });
		expect(routes(dir)('animation/demo.html/+page.svelte')).toBe(true);
		expect(existsSync(join(dir, '.samples-ref'))).toBe(false);
	});

	// The capital M in the hint is a promise about what the Enter key does.
	it('Enter takes the capitalised default — minimal', () => {
		const { dir } = typeAtPrompts({});
		expect(routes(dir)('slides/demo.html/+page.svelte')).toBe(true); // the kept deck, verbatim
		expect(existsSync(join(dir, '.samples-ref/animation'))).toBe(true); // the rest, moved
	});

	// A prompt you don't understand is worse than no prompt: you either guess, or you quit and
	// go read the README. '?' is the third option, and it costs one keystroke.
	it("'?' explains the question and then asks it again", () => {
		const { stderr, status } = typeAtPrompts({}, [
			'', // dir
			'?', // mode — help, which must NOT count as an answer...
			's', // ...so the question comes back, and this is the real one
			'', // kind, name, base, dist, env, proceed
			'',
			'',
			'',
			'',
			''
		]);
		expect(stderr).toContain('demo slides'); // the help actually printed...
		expect(stderr.match(/Samples —/g)?.length).toBe(2); // ...and the question came back
		expect(status).toBe(0);
	});

	// The env prompt answers [h]ost with 'h'. If 'h' ALSO meant help, one of the two would
	// silently lose — so help is '?' or the whole word, never a letter that means something.
	it("'h' still means host, not help", () => {
		const { dir } = typeAtPrompts({ env: 'h' });
		expect(existsSync(join(dir, 'booth'))).toBe(false);
	});

	// A one-letter prompt invites a mistyped letter. Several questions in, dying on it would
	// mean answering the earlier ones again — so it re-asks, and the run survives. Raw
	// keystrokes: the rejected 'x' consumes a line and the RE-ASK consumes the next, which is
	// precisely the shift promptOrder() cannot model.
	it('re-asks on an answer it does not know, rather than aborting the run', () => {
		const { dir, stderr, status } = typeAtPrompts({}, [
			'', // dir
			'x', // mode — rejected...
			's', // ...and asked again: skeleton
			'', // kind  -> deck
			'', // name  -> slides
			'', // base
			'', // dist  -> gp/dist
			'', // env   -> booth
			'' //  proceed
		]);
		expect(stderr).toMatch(/not one of/i);
		expect(status).toBe(0);
		expect(routes(dir)('slides/title.html/+page.svelte')).toBe(true);
	});
});

// GeekPresent tracks its own CodingBooth, so `booth` + `.booth/` ride along with the clone
// no matter what. Before this prompt existed they arrived unannounced — a 42KB binary and a
// dotfolder the adopter never asked for and would be nervous about deleting. The prompt does
// not INSTALL anything; it decides whether the one that came along stays.
describe('the build-environment prompt — [Bh]', () => {
	const booth = (dir: string) => existsSync(join(dir, 'booth')) || existsSync(join(dir, '.booth'));

	it('offers booth or host, with booth as the default', () => {
		const { stderr } = typeAtPrompts({});
		expect(stderr).toContain('[Bh]');
	});

	it('Enter keeps the booth that came with the clone', () => {
		const { dir } = typeAtPrompts({});
		expect(existsSync(join(dir, 'booth'))).toBe(true);
		expect(existsSync(join(dir, '.booth/Boothfile'))).toBe(true);
	});

	// Chosen deliberately over leaving it in place unused: someone who says "I have node"
	// should not be left with container files they have to work out are safe to remove.
	it("'h' removes the booth entirely — no leftovers to wonder about", () => {
		const { dir } = typeAtPrompts({ env: 'h' });
		expect(booth(dir)).toBe(false);
	});

	it('removing the booth touches nothing else — the deck still builds on the host', () => {
		const { dir } = typeAtPrompts({ env: 'h' });
		expect(existsSync(join(dir, 'src/routes/slides/pages.ts'))).toBe(true);
		expect(existsSync(join(dir, 'src/lib/seo/routes.ts'))).toBe(true);
	});
});

// Where the built site lands. The answer worth supporting is '../site': publishing INTO an
// existing hand-written site at the repo root, rather than into a dist/ nobody ever looks at.
describe('the build-output prompt', () => {
	it('defaults to dist inside the subfolder', () => {
		const { stderr } = typeAtPrompts({});
		expect(stderr).toMatch(/output\s+: gp\/dist\//);
	});

	// You type paths from where you STAND, so a site/ beside gp/ is just 'site'. The builder
	// runs inside gp/ and needs to hear '../site' for the same folder — one of those two
	// spellings is always wrong for whoever is asking, and printing the wrong one is how you
	// get someone deploying an empty directory.
	it("takes 'site' as beside the subfolder, not inside it", () => {
		const { stderr } = typeAtPrompts({ dist: 'site' });
		expect(stderr).toMatch(/output\s+: site\//);
		expect(stderr).not.toContain('gp/site');
	});

	// The booth mounts ONLY the subfolder, so a build inside it cannot write to a site/ beside
	// it — the path is not there. Warning beats a "successful" build that produced nothing.
	it('warns that the booth cannot reach an output outside the subfolder', () => {
		const { stderr } = typeAtPrompts({ dist: 'site' }); // env defaults to booth
		expect(stderr).toMatch(/booth only sees/i);
	});

	it('says nothing about the booth when the output is inside the subfolder', () => {
		const { stderr } = typeAtPrompts({});
		expect(stderr).not.toMatch(/booth only sees/i);
	});
});

describe('the scaffold prompt — [Dtn]', () => {
	it('offers one letter per kind, with the default capitalised', () => {
		const { stderr } = typeAtPrompts({ mode: 's' });
		expect(stderr).toContain('[Dtn]');
	});

	it("'t' scaffolds a Text page instead of a deck", () => {
		const { dir } = typeAtPrompts({ mode: 's', kind: 't', name: 'guide.html' });
		expect(routes(dir)('guide.html/+layout.svelte')).toBe(true);
		expect(routes(dir)('slides')).toBe(false);
	});

	it("'n' scaffolds nothing at all", () => {
		const { dir } = typeAtPrompts({ mode: 's', kind: 'n' });
		expect(routes(dir)('slides')).toBe(false);
		expect(routes(dir)('(home)/+page.svelte')).toBe(true); // the landing page, carrying the recipe
	});
});
