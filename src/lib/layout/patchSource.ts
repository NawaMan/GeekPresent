// Server-side source patcher for the LAYOUT-mode "Save" feature.
//
// LAYOUT edits live only in the browser (see layoutMode.ts / layoutChanges.ts) —
// the author drags a <Block>, and the only way those coordinates ever reach the
// slide's Svelte source is a copy → paste. "Save" closes that loop IN DEV ONLY:
// the browser POSTs the changed tags to a Vite dev endpoint (devSavePlugin.ts)
// which calls this module to rewrite the `.svelte` file on disk, then HMR
// reloads the slide.
//
// The hard part is matching. The registry's `oldTag` is a RE-SERIALIZATION of a
// Block's props (canonical `<Block name=".." x={..} …>`), not the literal source
// bytes — so a whole-line string replace misses any tag written multi-line, with
// reordered/extra attributes, or with expressions. So we DON'T match whole lines.
// Instead we locate the target opening tag (by `name`, falling back to its old
// x/y/width/height tuple) and rewrite ONLY the numeric geometry attributes in
// place — x/y/width/height, plus `z` when the tag carries one or the new z is
// non-zero — preserving indentation, multi-line layout, and every other prop.
// Anything we can't confidently place is returned as `unmatched` for the author
// to paste by hand — never guessed.
//
// Pure and browser-free so it unit-tests without a dev server (tests/layoutPatch.test.ts).

export interface Geometry {
	x: number;
	y: number;
	width: number;
	height: number;
	/** Persistent stacking order (Block `z`). Optional: only rewritten in place
	    when the tag already carries a `z={…}`, or inserted when non-zero — so a
	    plain x/y drag never litters the source with `z={0}`. */
	z?: number;
}

export interface LayoutChange {
	/** Component/tag name — 'Block', 'ImageBlock', 'Curve', … */
	kind: string;
	/** The tag's `name=".."`, when it has one (the strongest match signal). */
	name?: string;
	// A change is applied one of two ways:
	//
	//   1. GEOMETRY (Blocks): give `before`/`after` and only the x/y/width/height
	//      numbers are rewritten in place — robust to attribute reordering,
	//      multi-line tags, and extra props.
	//
	//   2. LITERAL (Draw shapes): give the whole `oldTag`/`newTag` opening tag and
	//      the first exact occurrence of oldTag is swapped for newTag. Draw emits
	//      its shapes' source tags in the same canonical order it serializes here,
	//      so the old tag matches the source line byte-for-byte. Curves/Lines/Arcs
	//      have no box geometry, so this is the only way to save them.
	//
	// A literal change (oldTag present) takes precedence; otherwise geometry is used.
	/** Geometry as the tag was mounted (matches the current source). */
	before?: Geometry;
	/** Geometry to write. */
	after?: Geometry;
	/** Whole opening tag as mounted — the literal string to find in source. */
	oldTag?: string;
	/** Whole opening tag to write in its place. */
	newTag?: string;
}

export interface PatchResult {
	/** The rewritten source (unchanged if nothing matched). */
	source: string;
	/** Changes that were located and applied. */
	patched: LayoutChange[];
	/** Changes no tag could be confidently matched to. */
	unmatched: LayoutChange[];
}

const GEOM_ATTRS = ['x', 'y', 'width', 'height'] as const;

interface TagSpan {
	/** Index of the leading `<` in the source. */
	start: number;
	/** Index just past the closing `>`. */
	end: number;
	/** The full opening-tag text, `<Kind …>` or `<Kind … />`. */
	text: string;
}

/** True when `ch` can't be part of a component tag name right after `<Kind`. */
function isTagBoundary(ch: string | undefined): boolean {
	return ch === undefined || /\s/.test(ch) || ch === '>' || ch === '/';
}

// Walk every `<Kind …>` opening tag in `source`. We can't lean on a regex for the
// whole tag because attribute values contain `{ … }` (which may hold `>`), so we
// scan character by character tracking quote + brace state and stop at the first
// top-level `>`.
function findOpeningTags(source: string, kind: string): TagSpan[] {
	const spans: TagSpan[] = [];
	const needle = `<${kind}`;
	let from = 0;
	for (;;) {
		const start = source.indexOf(needle, from);
		if (start === -1) break;
		// Reject `<Blockish` when scanning for `<Block`: the char after the name
		// must end the identifier.
		if (!isTagBoundary(source[start + needle.length])) {
			from = start + needle.length;
			continue;
		}
		let i = start + needle.length;
		let brace = 0;
		let quote: string | null = null;
		let end = -1;
		for (; i < source.length; i++) {
			const ch = source[i];
			if (quote) {
				if (ch === quote) quote = null;
				continue;
			}
			if (ch === '"' || ch === "'") quote = ch;
			else if (ch === '{') brace++;
			else if (ch === '}') brace = Math.max(0, brace - 1);
			else if (ch === '>' && brace === 0) {
				end = i + 1;
				break;
			}
		}
		if (end === -1) break; // unterminated tag — give up on this file
		spans.push({ start, end, text: source.slice(start, end) });
		from = end;
	}
	return spans;
}

/** Read `attr={<number>}` out of a tag's text; null when absent or non-numeric. */
function readGeomAttr(tagText: string, attr: string): number | null {
	const m = tagText.match(new RegExp(`\\b${attr}=\\{([^}]*)\\}`));
	if (!m) return null;
	const n = Number(m[1].trim());
	return Number.isFinite(n) ? n : null;
}

/** Does a tag carry `name="<name>"` (or single-quoted)? */
function hasName(tagText: string, name: string): boolean {
	return new RegExp(`\\bname=(["'])${escapeRegExp(name)}\\1`).test(tagText);
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function geomMatches(tagText: string, g: Geometry | undefined): boolean {
	if (!g) return false;
	return GEOM_ATTRS.every((a) => readGeomAttr(tagText, a) === Math.round(g[a]));
}

/** Pick the tag this change targets, or null if none is a confident match. */
function chooseTarget(spans: TagSpan[], change: LayoutChange): TagSpan | null {
	let pool = spans;
	if (change.name) {
		const named = pool.filter((s) => hasName(s.text, change.name!));
		// A name should be unique on a slide; if exactly one carries it, take it
		// even if its geometry drifted. If NONE carries it, the tag isn't in this
		// file (likely an imported child component) — report unmatched rather than
		// risk patching an unrelated tag that merely shares the geometry. With
		// several, narrow by geometry to disambiguate.
		if (named.length === 1) return named[0];
		if (named.length === 0) return null;
		pool = named;
	}
	const byGeom = pool.filter((s) => geomMatches(s.text, change.before));
	return byGeom.length === 1 ? byGeom[0] : null;
}

/** Rewrite the four geometry attributes in a single opening tag's text, plus the
    optional `z` (stacking order) — but z, unlike x/y/width/height, is never
    inserted just to write a 0: a Block defaults to `z-index: auto`, so a tag with
    no z is CORRECT at z 0 and must stay clean. z is therefore written only when
    the tag already carries a `z={…}` (rewrite it — including down to 0) or the new
    value is non-zero (insert it). */
function applyGeometry(tagText: string, after: Geometry): string {
	let out = tagText;
	for (const attr of GEOM_ATTRS) {
		const val = Math.round(after[attr]);
		const re = new RegExp(`(\\b${attr}=\\{)[^}]*(\\})`);
		if (re.test(out)) {
			out = out.replace(re, `$1${val}$2`);
		} else {
			// Attr missing on the tag — insert it just before the tag close.
			const insert = ` ${attr}={${val}}`;
			out = out.replace(/\s*\/?>$/, (close) => insert + close);
		}
	}
	if (after.z != null) {
		const val = Math.round(after.z);
		const zre = /(\bz=\{)[^}]*(\})/;
		if (zre.test(out)) {
			out = out.replace(zre, `$1${val}$2`);
		} else if (val !== 0) {
			out = out.replace(/\s*\/?>$/, (close) => ` z={${val}}` + close);
		}
	}
	return out;
}

/**
 * Apply LAYOUT geometry changes to a slide's Svelte source. Each change is
 * matched to one opening tag and its x/y/width/height rewritten in place; the
 * rest of the tag (and file) is untouched. Changes are applied sequentially so
 * a just-patched tag can't be re-matched by a later change.
 */
export function patchSlideSource(source: string, changes: LayoutChange[]): PatchResult {
	let current = source;
	const patched: LayoutChange[] = [];
	const unmatched: LayoutChange[] = [];

	for (const change of changes) {
		// Literal whole-tag replacement (Draw shapes): find the exact old tag and
		// swap it. Draw authors its shape tags in the order it serializes, so the
		// old tag is a byte-for-byte source match.
		if (change.oldTag != null && change.newTag != null) {
			if (change.oldTag === change.newTag) {
				patched.push(change); // not actually dirty — nothing to do
				continue;
			}
			const at = current.indexOf(change.oldTag);
			if (at === -1) {
				unmatched.push(change);
				continue;
			}
			current = current.slice(0, at) + change.newTag + current.slice(at + change.oldTag.length);
			patched.push(change);
			continue;
		}

		// Geometry attribute patch (Blocks).
		if (!change.after) {
			unmatched.push(change);
			continue;
		}
		const spans = findOpeningTags(current, change.kind);
		const target = chooseTarget(spans, change);
		if (!target) {
			unmatched.push(change);
			continue;
		}
		const newText = applyGeometry(target.text, change.after);
		if (newText === target.text) {
			// Nothing to write (already at the target geometry) — count as done.
			patched.push(change);
			continue;
		}
		current = current.slice(0, target.start) + newText + current.slice(target.end);
		patched.push(change);
	}

	return { source: current, patched, unmatched };
}
