import { describe, expect, it } from 'vitest';
import {
	SVELTE_LANGUAGE_CONFIG,
	TokenState,
	hex6,
	monacoTheme,
	monacoTokens,
	scopeFor,
	themeRules,
	tokenizeLine,
	type LineGrammar,
	type RuleStack
} from '../src/lib/utils/shikiMonacoCore';
import { grammarFor } from '../src/lib/utils/highlight';

// vscode-textmate metadata: foreground at bit 15, font style at bit 11.
const meta = (fg: number, fontStyle = 0) => ((fg << 15) | (fontStyle << 11)) >>> 0;

describe('scopeFor', () => {
	it('names a colour index, with the font style as a suffix', () => {
		expect(scopeFor(7)).toBe('gp7');
		expect(scopeFor(7, 1)).toBe('gp7.i');
		expect(scopeFor(7, 2)).toBe('gp7.b');
		expect(scopeFor(7, 3)).toBe('gp7.ib');
		// Underline (4) is not a Monaco font style we emit.
		expect(scopeFor(7, 4)).toBe('gp7');
	});
});

describe('monacoTokens', () => {
	it('decodes start offsets and foreground/style from the binary pairs', () => {
		const binary = new Uint32Array([0, meta(3), 5, meta(9, 1), 8, meta(3)]);
		expect(monacoTokens(binary)).toEqual([
			{ startIndex: 0, scopes: 'gp3' },
			{ startIndex: 5, scopes: 'gp9.i' },
			{ startIndex: 8, scopes: 'gp3' }
		]);
	});

	it('merges adjacent tokens of the same scope', () => {
		const binary = [0, meta(3), 2, meta(3), 4, meta(5)];
		expect(monacoTokens(binary)).toEqual([
			{ startIndex: 0, scopes: 'gp3' },
			{ startIndex: 4, scopes: 'gp5' }
		]);
	});

	it('is total: empty and odd-length input yield what can be read', () => {
		expect(monacoTokens([])).toEqual([]);
		expect(monacoTokens([0])).toEqual([]);
	});
});

describe('hex6', () => {
	it('normalises the colour forms a theme uses', () => {
		expect(hex6('#A7C080')).toBe('a7c080');
		expect(hex6('#a7c08080')).toBe('a7c080');
		expect(hex6('#abc')).toBe('aabbcc');
	});
	it('rejects anything else', () => {
		for (const bad of [undefined, null, '', 'red', '#12', '#12345', 'a7c080', 42]) {
			expect(hex6(bad)).toBeNull();
		}
	});
});

describe('themeRules / monacoTheme', () => {
	it('gives every colour all four font-style scopes, skipping junk entries', () => {
		const rules = themeRules([undefined, '#ffffff', 'nope', '#000']);
		expect(rules.map((r) => r.token)).toEqual([
			'gp1',
			'gp1.i',
			'gp1.b',
			'gp1.ib',
			'gp3',
			'gp3.i',
			'gp3.b',
			'gp3.ib'
		]);
		expect(rules.find((r) => r.token === 'gp3.ib')).toEqual({
			token: 'gp3.ib',
			foreground: '000000',
			fontStyle: 'italic bold'
		});
	});

	it('inherits vs-dark, so Monarch languages on the same page keep their colours', () => {
		expect(monacoTheme()).toEqual({ base: 'vs-dark', inherit: true, rules: [], colors: {} });
	});
});

class FakeStack implements RuleStack {
	constructor(readonly depth: number) {}
	equals(other: RuleStack): boolean {
		return other instanceof FakeStack && other.depth === this.depth;
	}
}

describe('TokenState', () => {
	it('compares by rule stack; null is the document start', () => {
		const a = new TokenState(new FakeStack(1));
		expect(a.equals(new TokenState(new FakeStack(1)))).toBe(true);
		expect(a.equals(new TokenState(new FakeStack(2)))).toBe(false);
		expect(a.equals(new TokenState(null))).toBe(false);
		expect(new TokenState(null).equals(new TokenState(null))).toBe(true);
		expect(a.equals({ stack: a.stack })).toBe(false);
		expect(a.clone().equals(a)).toBe(true);
	});
});

describe('tokenizeLine', () => {
	const grammar: LineGrammar<FakeStack> = {
		tokenizeLine2: (line, prev, _limit) => ({
			tokens: new Uint32Array([0, meta(2)]),
			ruleStack: new FakeStack((prev?.depth ?? 0) + 1),
			stoppedEarly: line === 'too long'
		})
	};

	it('carries the rule stack to the next line', () => {
		const r = tokenizeLine(grammar, 'x', new TokenState<FakeStack>(null));
		expect(r.tokens).toEqual([{ startIndex: 0, scopes: 'gp2' }]);
		expect(r.endState.stack?.depth).toBe(1);
	});

	it('keeps the incoming state when the grammar gives up on a line', () => {
		const start = new TokenState(new FakeStack(4));
		expect(tokenizeLine(grammar, 'too long', start).endState).toBe(start);
	});
});

describe('the real Shiki Svelte grammar through the bridge', () => {
	const source = [
		'<script>',
		"\tlet name = 'world';",
		'</script>',
		'<h1 class="big">Hello {name}!</h1>',
		'<style>',
		'\th1 { color: red; }',
		'</style>'
	];

	it('colours script, markup, expressions and style, and the theme covers every scope', async () => {
		const { grammar, colorMap } = await grammarFor('svelte');
		const lineGrammar = grammar as unknown as LineGrammar;
		let state = new TokenState(null);
		const lines = source.map((line) => {
			const r = tokenizeLine(lineGrammar, line, state);
			state = r.endState;
			return r.tokens;
		});

		// Every line is split into several differently-coloured runs — not one
		// flat colour, which is how `html` showed the <script> body.
		for (const tokens of lines) {
			expect(new Set(tokens.map((t) => t.scopes)).size).toBeGreaterThan(1);
		}
		// The keyword `let` and the string are not the same colour.
		const script = lines[1];
		const at = (col: number) => [...script].reverse().find((t) => t.startIndex <= col)!.scopes;
		expect(at(1)).not.toBe(at(13));

		const themed = new Set(themeRules(colorMap).map((r) => r.token));
		for (const t of lines.flat()) expect(themed.has(t.scopes)).toBe(true);
	});

	it('leaves the stack balanced after a complete component', async () => {
		const { grammar } = await grammarFor('svelte');
		const lineGrammar = grammar as unknown as LineGrammar;
		let state = new TokenState(null);
		for (const line of source) state = tokenizeLine(lineGrammar, line, state).endState;
		const first = tokenizeLine(lineGrammar, '<p>after</p>', state).tokens;
		const fresh = tokenizeLine(lineGrammar, '<p>after</p>', new TokenState(null)).tokens;
		expect(first).toEqual(fresh);
	});
});

describe('SVELTE_LANGUAGE_CONFIG', () => {
	it('comments with HTML comments and auto-closes Svelte braces', () => {
		expect(SVELTE_LANGUAGE_CONFIG.comments.blockComment).toEqual(['<!--', '-->']);
		expect(SVELTE_LANGUAGE_CONFIG.autoClosingPairs).toContainEqual({ open: '{', close: '}' });
	});
});
