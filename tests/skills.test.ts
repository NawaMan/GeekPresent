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
	it('ships the four GeekPresent convention skills alongside the TODO workflow ones', () => {
		expect(skillNames).toEqual([
			'adjust-mode',
			'deck-tests',
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
});
