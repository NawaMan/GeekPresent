// The agent skills in `.claude/skills/` are only useful while the paths they name are
// real. They rot silently: nothing imports a SKILL.md, so a moved file leaves the prose
// confidently pointing at nothing, and the next agent follows it. (This test was written
// after exactly that — two skills still said `lib/styles/roles.css` long after roles.css
// moved to `src/lib/themes/`.)
//
// So: every repo-relative path a skill states as fact must exist. Prose placeholders
// (`src/routes/<deck>/pages.ts`), globs (`tests/**/*.test.ts`) and non-paths (`?layout=off`,
// `/__geekpresent/layout-save`) are not claims about the tree and are skipped.
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
			'deck-tests',
			'layout-mode',
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

	it.each(skillNames)('%s: every repo path it cites exists', (name) => {
		const missing = citedPaths(skillBody(name)).filter(
			// A directory is cited with a trailing slash; existsSync takes either.
			(p) => !existsSync(`${REPO}${p.replace(/\/$/, '')}`)
		);
		expect(missing).toEqual([]);
	});

	it('cites the house patterns it promises to teach', () => {
		// Cheap smoke test that the skills still point at the real mechanisms, so a
		// rename of one of these lands here rather than in an agent's lap.
		expect(skillBody('new-component')).toContain('src/lib/themes/roles.css');
		expect(skillBody('layout-mode')).toContain('src/lib/layout/styleGuardCore.ts');
		expect(skillBody('layout-mode')).toContain('src/lib/stores/blockAnchors.ts');
		expect(skillBody('deck-tests')).toContain('svelte/server');
	});
});
