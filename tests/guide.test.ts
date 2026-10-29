// guide/ is the authoring guide a project's AI agent reads from node_modules. It drifts the
// moment a component is added, renamed or moved, and an agent trusts it — so this pins it:
// every author-facing component is documented, and every import and link in it resolves.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const GUIDE = 'guide';
const docs = readdirSync(GUIDE)
	.filter((f) => f.endsWith('.md'))
	.map((f) => ({ file: f, text: readFileSync(join(GUIDE, f), 'utf8') }));
const all = docs.map((d) => d.text).join('\n');

/** Framework machinery no slide places: SlideDeck mounts it, or another component uses it. */
const INTERNAL = new Set([
	'Annotate', 'ControlBar', 'Copyright', 'CtrlBtn', 'KioskDialog', 'KioskIndicator', 'KioskRunner',
	'NavigationBar', 'NoteEditor', 'OnboardHint', 'OverviewPage', 'PresenterAnim', 'PresenterView',
	'Seo', 'SizeMode', 'SlideMap', 'SlideToolbar', 'Spotlight', 'StepDots', 'TableOfContent', 'DrawHandle',
	'JavaCode', 'JavaCodeBox',
	// rendered by the charts and DataTable themselves
	'Axis', 'ChartTooltip', 'Pagination', 'SearchBox'
]);

const DIRS = ['components', 'templates', 'draw', 'chart', 'datatable'];
const components = DIRS.flatMap((d) =>
	readdirSync(join('src/lib', d))
		.filter((f) => f.endsWith('.svelte'))
		.map((f) => basename(f, '.svelte'))
);

describe('guide/', () => {
	it('has the general file and the group files', () => {
		const names = docs.map((d) => d.file);
		expect(names).toContain('README.md');
		for (const g of ['slide-pages', 'layout', 'content', 'code', 'media', 'data', 'draw', 'features'])
			expect(names).toContain(`${g}.md`);
	});

	it('documents every author-facing component', () => {
		const missing = components.filter((c) => !INTERNAL.has(c) && !new RegExp(`\\b${c}\\b`).test(all));
		expect(missing).toEqual([]);
	});

	it('indexes every author-facing component in README.md', () => {
		const index = docs.find((d) => d.file === 'README.md')!.text.split('## Components')[1] ?? '';
		const missing = components.filter((c) => !INTERNAL.has(c) && !new RegExp(`\\b${c}\\b`).test(index));
		expect(missing).toEqual([]);
	});

	it('imports only paths the package has', () => {
		const bad: string[] = [];
		for (const { file, text } of docs) {
			for (const [, spec] of text.matchAll(/['"]@geekpresent\/core\/([^'"]+)['"]/g)) {
				const base = join('src/lib', spec);
				const ok = [base, `${base}.ts`, `${base}.js`, join(base, 'index.ts')].some((p) => existsSync(p));
				if (!ok) bad.push(`${file}: @geekpresent/core/${spec}`);
			}
		}
		expect(bad).toEqual([]);
	});

	it('links only to guide files that exist', () => {
		const bad: string[] = [];
		for (const { file, text } of docs) {
			for (const [, target] of text.matchAll(/\]\(([\w-]+\.md)(?:#[^)]*)?\)/g)) {
				if (!existsSync(join(GUIDE, target))) bad.push(`${file} -> ${target}`);
			}
		}
		expect(bad).toEqual([]);
	});
});
