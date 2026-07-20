// The agent skills in `.claude/skills/` are only useful while the paths they name are
// real. They rot silently: nothing imports a SKILL.md, so a moved file leaves the prose
// confidently pointing at nothing, and the next agent follows it. (This test was written
// after exactly that — two skills still said `lib/styles/roles.css` long after roles.css
// moved to `src/lib/themes/`.)
//
// So: every repo-relative path a skill states as fact must exist. Prose placeholders
// (`src/routes/<deck>/pages.ts`), globs (`tests/**/*.test.ts`) and non-paths (`?adjust=off`,
// `/__geekpresent/adjust-save`) are not claims about the tree and are skipped.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// vitest roots at the repo, and `import.meta.url` here is a vite-served /@fs/ URL.
const REPO = `${process.cwd()}/`;
const SKILLS = `${REPO}.claude/skills`;

/** Top-level dirs a backticked token must start with to be read as a repo path. */
const ROOTS = ['src/', 'tests/', 'utils/', 'static/', 'narration/', 'specs/', '.claude/'];

const skillNames = readdirSync(SKILLS, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.sort();

const skillBody = (name: string) => readFileSync(`${SKILLS}/${name}/SKILL.md`, 'utf8');

/** The backticked tokens in a SKILL.md that are genuinely claims about the file tree. */
function citedPaths(md: string): string[] {
	const cited = [...md.matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim());
	return cited.filter(
		(t) =>
			ROOTS.some((r) => t.startsWith(r)) &&
			!t.includes('*') && // a glob, not a file
			!t.includes('<') && // a placeholder: src/routes/<deck>/
			!t.includes(' ')
	);
}

describe('agent skills', () => {
	it('ships the four GeekPresent convention skills alongside the TODO and git workflow ones', () => {
		expect(skillNames).toEqual([
			'adjust-mode',
			'deck-tests',
			'land-branch',
			'new-component',
			'new-slide',
			'pick-todo',
			'todo'
		]);
	});

	it.each(skillNames)('%s: frontmatter names itself after its directory', (name) => {
		const md = skillBody(name);
		expect(md.startsWith('---\n')).toBe(true);

		const frontmatter = md.slice(4, md.indexOf('\n---', 4));
		// A `name:` that disagrees with the directory is not invocable.
		expect(frontmatter).toContain(`name: ${name}`);
		// The description is what the model matches a request against — an empty one
		// means the skill is shipped but never chosen.
		const description = /^description: (.+)$/m.exec(frontmatter)?.[1] ?? '';
		expect(description.length).toBeGreaterThan(40);
	});

	// This test ships to adopted projects too, and `adopt-geekpresent.sh` (minimal /
	// skeleton) moves the sample decks to a gitignored `.samples-ref/` — kept on disk
	// precisely so agents can still read them. A skill citing `src/routes/slides/…`
	// is therefore still telling the truth there, at the relocated path. So: a cited
	// path must exist in the tree, OR in the samples reference. In THIS repo there is
	// no `.samples-ref/`, so the fallback never fires and the rot-check stays strict.
	const onDisk = (p: string) => {
		const path = p.replace(/\/$/, ''); // a dir is cited with a trailing slash
		if (existsSync(`${REPO}${path}`)) return true;
		const relocated = path.replace(/^src\/routes\//, '.samples-ref/');
		return relocated !== path && existsSync(`${REPO}${relocated}`);
	};

	it.each(skillNames)('%s: every repo path it cites exists', (name) => {
		const missing = citedPaths(skillBody(name)).filter((p) => !onDisk(p));
		expect(missing).toEqual([]);
	});

	it('cites the house patterns it promises to teach', () => {
		// Cheap smoke test that the skills still point at the real mechanisms, so a
		// rename of one of these lands here rather than in an agent's lap.
		expect(skillBody('new-component')).toContain('src/lib/themes/roles.css');
		expect(skillBody('adjust-mode')).toContain('src/lib/adjust/styleGuardCore.ts');
		expect(skillBody('adjust-mode')).toContain('src/lib/stores/blockAnchors.ts');
		expect(skillBody('deck-tests')).toContain('svelte/server');
	});

	// pick-todo offers to build in an isolated worktree. That recipe is spelled out once,
	// in AGENTS.md — the skill must keep quoting it verbatim, not a paraphrase that could
	// drift into "just add a worktree" and silently drop the branch. If AGENTS.md's own
	// recipe ever changes, this fails on the skill side instead of shipping a stale one.
	it('pick-todo: worktree offer quotes AGENTS.md\'s own worktree+branch recipe', () => {
		const recipe = 'git worktree add worktree/<name> -b <name>';
		expect(readFileSync(`${REPO}AGENTS.md`, 'utf8')).toContain(recipe);
		expect(skillBody('pick-todo')).toContain(recipe);
		// Not just the command — the requirement that a branch is non-optional.
		expect(skillBody('pick-todo')).toMatch(/make sure a branch/i);
	});

	// land-branch is the executable form of AGENTS.md's landing procedure. Its load-bearing
	// part is the merge SHAPE — a real merge commit, never a squash — because a flattened
	// branch cannot be un-flattened. Pin it on both sides so a drift into `--squash` fails
	// here rather than quietly destroying a worktree's history. Same for the boundary that
	// keeps landing from chaining into deleting the user's worktree unasked.
	it("land-branch: keeps AGENTS.md's --no-ff merge and refuses to squash", () => {
		const body = skillBody('land-branch');
		expect(readFileSync(`${REPO}AGENTS.md`, 'utf8')).toContain('git merge --no-ff');
		expect(body).toContain('git merge --no-ff');
		expect(body).toMatch(/never[^a-z]*--squash/i);
		expect(body).toMatch(/separate ask/i);
	});

	// pick-todo: after the menu pick, full Proposal before code still waits — a one-line
	// pitch is not a plan. Worktree is the default isolation unless the user opts out.
	it('pick-todo: discuss after pick; default to worktree', () => {
		const body = skillBody('pick-todo');
		expect(body).toMatch(/Proposal before code/i);
		expect(body).toMatch(/Two gates/i);
		expect(body).toMatch(/not detailed enough|not a plan|blank check/i);
		expect(body).toMatch(/Default to worktree/i);
		// Must not tell the agent the pick is enough to start writing.
		expect(body).not.toMatch(/Once they choose, the ambiguity is gone/i);
		expect(body).not.toMatch(/Default to "here"/i);
	});

	// Proposal-before-code is the house "discuss first" gate. It lived only in the user's
	// head until agents kept jumping straight to edits; pin both the AGENTS.md rule and
	// that every skill still points at it (or names its own replacing gate), so a skill
	// rewrite cannot silently drop the wait.
	it('AGENTS.md and skills: Proposal before code (Problem · Diagnostic · Approach)', () => {
		const agents = readFileSync(`${REPO}AGENTS.md`, 'utf8');
		expect(agents).toContain('### Proposal before code');
		expect(agents).toMatch(/0\.\s+\*\*Proposal before code\.\*\*/);
		expect(agents).toContain('**Problem**');
		expect(agents).toContain('**Diagnostic**');
		expect(agents).toContain('**Approach**');
		expect(agents).toMatch(/stop and wait/i);
		// Feature work defaults to a linked worktree unless the user opts out.
		expect(agents).toMatch(/Default for feature work: use a linked worktree/i);

		// Implementation / mutation skills must surface the gate when loaded alone.
		for (const name of [
			'new-slide',
			'new-component',
			'adjust-mode',
			'deck-tests',
			'land-branch',
			'pick-todo'
		]) {
			expect(skillBody(name)).toMatch(/Proposal before code/i);
		}
		// pick-todo: menu is gate 1; full form after pick is still required.
		expect(skillBody('pick-todo')).toMatch(/still/i);
		// todo records only — must not invent a build path that skips Rule 0.
		expect(skillBody('todo')).toMatch(/Not an implementation skill/i);
		// land-branch must wait after preflight, not treat "land this" as a blank check.
		expect(skillBody('land-branch')).toMatch(/wait/i);
	});
});
