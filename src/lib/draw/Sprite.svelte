<!--
  Sprite — a positioned, rotatable HTML element that flies along a path of
  keyframe stops. This is the KeyframeStudio "flying element" folded into the
  Draw family, so ONE surface authors both SVG shapes AND moving HTML sprites
  on one timeline:

      <Draw title="Launch">
        <Sprite name="rocket" animate={2.5} fontScale={0.84}
          stops={[
            { pct: 0,   x: 0,    y: 1025, w: 56,  h: 55,  rot: 20, ease: "ease-in"  },
            { pct: 100, x: 1528, y: 432,  w: 228, h: 219, rot: -45 },
          ]}>🚀</Sprite>
        <Line from={[…]} to={[…]} draw={2.5} />   (draws itself on the SAME bar)
      </Draw>

  HOW IT FITS THE DRAW FAMILY: like Line/Curve/Arc, the Sprite renders its own
  content + generated CSS @keyframes and only REGISTERS a ShapeEditor for
  selection / Copy — Draw hosts nothing for it. The one twist is that the
  visual is HTML, not SVG, so the moving element rides in a <foreignObject>
  spanning the canvas (SVG user units == canvas px, so a stop's x/y/w/h are
  the element's left/top/width/height with no math). The animation is pure CSS
  (left/top/width/height/transform + per-stop easing), so it prerenders and
  the AnimationBar scrubs it exactly like every other shape's animation —
  no Web Animations API, unlike the standalone KeyframeStudio.

  LAYOUT-mode editing: each stop grows a ghost box with a MOVE handle (drag to
  reposition), a RESIZE handle (bottom-right corner) and a ROTATE handle; the
  keyframe panel retimes / adds / removes stops and sets per-stop easing, just
  like the path shapes. Geometry is edited by DRAGGING (the Draw convention),
  so the panel needs no l/t/w/h fields. Edits are finder state — Copy → paste
  is the only persistence — and every completed drag records to LAYOUT undo.

  The moving element is pointer-events:none (the surface never eats input);
  only the LAYOUT handles re-enable the pointer, and only in LAYOUT mode.
-->
<script lang="ts">
	import { getContext, onDestroy, setContext, untrack, type Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { record } from '$lib/stores/layoutHistory';
	import DrawHandle from './DrawHandle.svelte';
	import {
		fmtNum,
		neighborsAt,
		newEditorId,
		playheadPercent,
		sanitizeEase,
		widestGapMid
	} from './editing';
	import { finite, round } from './drawCore';
	import {
		DRAW_CONTEXT_KEY,
		SPRITE_ISOLATION_KEY,
		type AnimEditor,
		type DrawContext,
		type Point,
		type ShapeEditor,
		type SpriteIsolation,
		type SpriteStop
	} from './types';

	interface Props {
		/** Geometry keyframes: the box (x/y/w/h + rot) per percent. Needs ≥2 to
		 *  animate; a single stop renders a static element. */
		stops: SpriteStop[];
		/** Seconds for one pass through `stops` (ease-in-out, fill both). */
		animate?: number;
		/** When set, emit `font-size: h*fontScale` on every frame so a glyph
		 *  grows with its box as it travels (the rocket case uses 0.84). */
		fontScale?: number | null;
		/** Static transform-origin (the rotation pivot), in %. A property of the
		 *  object, not a moment — lives on the element, not the keyframes. */
		origin?: string;
		/** Shown in the editing readout + copied tag (mirrors Block's). */
		name?: string;
		/** Snap step (canvas px) while dragging handles. 1 = freeform. */
		grid?: number;
		/** Treat this sprite as a GROUP of editable shapes (children are a nested
		 *  <Draw>): in LAYOUT, double-click to enter isolation — freeze + straighten
		 *  — and edit the nested shapes; Esc / click-outside exits. Off by default,
		 *  so a plain glyph sprite keeps its simple select-and-fly behavior. */
		group?: boolean;
		children?: Snippet;
		/** Inline style for the root element, applied last so it wins. */
		style?: string;
		/** DOM id for the root element. */
		id?: string;
		/** Extra class(es) for the root element. NOTE: a slide's own scoped styles
		 *  will NOT match — use global CSS (global.css / roles.css / a :global(...)
		 *  block) or a utility class. See AGENTS.md. */
		class?: string;
	}

	let {
		stops,
		animate,
		fontScale = null,
		origin = '50% 50%',
		name = '',
		grid = 1,
		group = false,
		children,
		style = '',
		id = '',
		class: klass = ''
	}: Props = $props();

	// LAYOUT-mode editing overrides: the editor is a coordinate FINDER — drags
	// mutate these locals (reset on reload), never the props; Copy → paste is
	// the only persistence.
	type IdStop = SpriteStop & { id: number };
	let liveStops = $state<IdStop[] | null>(null);
	let stopSeq = 0;
	const S = $derived<SpriteStop[]>(liveStops ?? stops ?? []);

	// Clone the prop stops into editable id-carrying state on first edit.
	function materializeStops(): IdStop[] {
		if (!liveStops) liveStops = (stops ?? []).map((s) => ({ ...s, id: stopSeq++ }));
		return liveStops;
	}

	const clampPct = (p: number) => Math.max(0, Math.min(100, finite(p)));
	// Resolved, NaN-safe stops in markup order (indices line up with S so a
	// handle can bind back by index); sizes clamp to ≥1 so a box never collapses.
	const RS = $derived(
		S.map((s) => ({
			pct: clampPct(s.pct),
			x: finite(s.x),
			y: finite(s.y),
			w: Math.max(1, finite(s.w)),
			h: Math.max(1, finite(s.h)),
			rot: finite(s.rot ?? 0),
			ease: sanitizeEase(s.ease)
		}))
	);
	// Sorted by percent — drives the @keyframes and the base (0%) pose.
	const sorted = $derived([...RS].sort((a, b) => a.pct - b.pct));
	const base = $derived(sorted[0] ?? { pct: 0, x: 0, y: 0, w: 100, h: 100, rot: 0, ease: '' });

	const animSecs = $derived(
		animate && Number.isFinite(animate) && animate > 0 && RS.length >= 2 ? animate : null
	);

	const uid = newEditorId();
	const animName = `draw-sprite-${uid}`;
	// Integer font-size (like KeyframeStudio) — clean output, no float noise.
	const fontFor = (h: number) => (fontScale == null ? null : Math.round(h * fontScale));

	// --- Generated CSS @keyframes: left/top/width/height + rotate (+ optional
	// font-size), one frame per stop. A per-stop timing function set INSIDE its
	// keyframe governs the segment starting there; '' inherits ease-in-out.
	const keyframesCss = $derived.by(() => {
		if (!animSecs) return '';
		const body = sorted
			.map((s) => {
				const fs = fontFor(s.h);
				return (
					`${s.pct}% { left:${round(s.x)}px; top:${round(s.y)}px; ` +
					`width:${round(s.w)}px; height:${round(s.h)}px; transform:rotate(${round(s.rot)}deg);` +
					`${fs != null ? ` font-size:${fs}px;` : ''}` +
					`${s.ease ? ` animation-timing-function:${s.ease};` : ''} }`
				);
			})
			.join(' ');
		return `@keyframes ${animName} { ${body} }`;
	});

	// Base (0%) inline pose — the static/no-JS/SSR fallback; the animation
	// (fill:both) takes over once the browser runs it.
	const baseStyle = $derived(
		`left:${round(base.x)}px; top:${round(base.y)}px; ` +
			`width:${round(base.w)}px; height:${round(base.h)}px; ` +
			`transform-origin:${origin}; transform:rotate(${round(base.rot)}deg);` +
			`${fontFor(base.h) != null ? ` font-size:${fontFor(base.h)}px;` : ''}` +
			`${animSecs ? ` animation:${animName} ${animSecs}s ease-in-out both;` : ''}`
	);

	// --- LAYOUT-mode editing chrome ------------------------------------------
	const ctx = getContext<DrawContext | undefined>(DRAW_CONTEXT_KEY);
	const editing = $derived(ctx?.editing ?? false);
	const cw = $derived(ctx?.width ?? 1920);
	const ch = $derived(ctx?.height ?? 1080);

	const stopLiteral = (s: {
		pct: number;
		x: number;
		y: number;
		w: number;
		h: number;
		rot: number;
		ease: string;
	}) =>
		`{ pct: ${fmtNum(s.pct)}, x: ${fmtNum(s.x)}, y: ${fmtNum(s.y)}, ` +
		`w: ${fmtNum(s.w)}, h: ${fmtNum(s.h)}${s.rot ? `, rot: ${fmtNum(s.rot)}` : ''}` +
		`${s.ease ? `, ease: "${s.ease}"` : ''} }`;

	const tagFor = (list: Array<Parameters<typeof stopLiteral>[0]>) =>
		`<Sprite${name ? ` name="${name}"` : ''}` +
		`${animate ? ` animate={${fmtNum(animate)}}` : ''}` +
		`${fontScale != null ? ` fontScale={${fmtNum(fontScale)}}` : ''}` +
		`${origin !== '50% 50%' ? ` origin="${origin}"` : ''}` +
		`${group ? ' group' : ''}` +
		` stops={[${list.map(stopLiteral).join(', ')}]}>`;

	// Source (prop) stops resolved the same way, for the "Copy changed" OLD side.
	const sourceStops = $derived(
		(stops ?? []).map((s) => ({
			pct: clampPct(s.pct),
			x: finite(s.x),
			y: finite(s.y),
			w: Math.max(1, finite(s.w)),
			h: Math.max(1, finite(s.h)),
			rot: finite(s.rot ?? 0),
			ease: sanitizeEase(s.ease)
		}))
	);
	const snippet = $derived(tagFor(RS));
	const sourceSnippet = $derived(tagFor(sourceStops));

	const editor: ShapeEditor = {
		id: uid,
		kind: 'Sprite',
		get name() {
			return name;
		},
		get readout() {
			return `${RS.length} stops · ${finite(animate ?? 0)}s`;
		},
		get snippet() {
			return snippet;
		},
		get sourceSnippet() {
			return sourceSnippet;
		},
		get dirty() {
			return snippet !== sourceSnippet;
		},
		get anim() {
			return animSecs ? animApi : null;
		},
		get chrome() {
			return chrome;
		}
	};
	const isSelected = $derived(ctx?.selected === editor);
	// Selected → Draw renders our `chrome` snippet in its top layer instead, so
	// we must not also render it inline (select-to-front; see DrawContext). The
	// ghost BOXES stay home either way — like a path shape's hit stroke, they
	// only compete with each other, and a selected sprite's box is a wide target
	// that would swallow every shape drawn under it.
	const isHoisted = $derived(ctx?.hoisted === editor);
	const select = () => ctx?.select(editor);
	$effect(() => {
		if (!ctx?.registerShape) return;
		// untrack: registering reads+writes Draw's shape list (see Rect.svelte).
		return untrack(() => ctx.registerShape(editor));
	});
	onDestroy(() => {
		if (ctx?.selected === editor) ctx.select(null);
	});

	// Materialize eagerly while the panel is up so its rows carry real ids.
	$effect(() => {
		if (editing && isSelected && animSecs && !liveStops) materializeStops();
	});

	// --- Per-stop geometry editing (drag the ghost). Live drags mutate the
	// stop; a completed gesture records the whole box before/after to undo.
	function setStopGeom(i: number, patch: Partial<SpriteStop>) {
		liveStops = materializeStops().map((s, k) => (k === i ? { ...s, ...patch } : s));
	}
	// Snapshot a stop's geometry (for undo), captured at pointer-down.
	const geomAt = (i: number): SpriteStop => {
		const s = RS[i];
		return { pct: s.pct, x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot, ease: s.ease };
	};
	let dragBefore: { i: number; box: SpriteStop } | null = null;
	function beginDrag(i: number) {
		select();
		dragBefore = { i, box: geomAt(i) };
	}
	function endDrag(i: number) {
		if (!dragBefore || dragBefore.i !== i) return;
		const before = dragBefore.box;
		const after = geomAt(i);
		dragBefore = null;
		if (before.x === after.x && before.y === after.y && before.w === after.w && before.h === after.h && before.rot === after.rot)
			return;
		record({ undo: () => setStopGeom(i, before), redo: () => setStopGeom(i, after) });
	}

	// Handle anchor points, in canvas px, computed from the (axis-aligned) box.
	const center = (s: { x: number; y: number; w: number; h: number }): Point => [s.x + s.w / 2, s.y + s.h / 2];
	const corner = (s: { x: number; y: number; w: number; h: number }): Point => [s.x + s.w, s.y + s.h];
	// Rotate grip: a point orbiting the center, offset "up" then turned by rot.
	const gripRadius = (s: { h: number }) => s.h / 2 + 40;
	function gripPoint(s: { x: number; y: number; w: number; h: number; rot: number }): Point {
		const [cx, cy] = center(s);
		const R = gripRadius(s);
		const th = (s.rot * Math.PI) / 180;
		return [round(cx + R * Math.sin(th)), round(cy - R * Math.cos(th))];
	}

	// Geometry stays on the integer grid (matches DrawHandle's snapped points
	// and Block's whole-pixel boxes), so copied stops read cleanly.
	function onMove(i: number, p: Point) {
		const s = RS[i];
		setStopGeom(i, { x: Math.round(p[0] - s.w / 2), y: Math.round(p[1] - s.h / 2) });
	}
	function onResize(i: number, p: Point) {
		const s = RS[i];
		setStopGeom(i, { w: Math.max(8, Math.round(p[0] - s.x)), h: Math.max(8, Math.round(p[1] - s.y)) });
	}
	function onRotate(i: number, p: Point) {
		const s = RS[i];
		const [cx, cy] = center(s);
		// Grip is "up" at rot 0, i.e. -90° from +x; add 90 to recover rot.
		const deg = (Math.atan2(p[1] - cy, p[0] - cx) * 180) / Math.PI + 90;
		setStopGeom(i, { rot: Math.round(deg) });
	}

	// Ref to the moving element, so "+ keyframe" / preview can read the live
	// playhead time off its CSS animation.
	let spriteEl = $state<HTMLElement>();

	// --- Isolation ("enter group") editing -----------------------------------
	// Double-click the sprite to FREEZE it at its current on-screen pose,
	// STRAIGHTEN it to rot 0, and make its content pointer-live — so the nested
	// shapes edit with the ordinary Draw machinery. Rotation is the ONLY thing
	// that broke DrawHandle's drag scale (getBoundingClientRect on a turned box
	// inflates the bbox); at rot 0 the nested svg is upright at plain deck scale,
	// identical to a standalone Draw, so its editing is known-good. Esc (or
	// toggling LAYOUT off) exits and restores the flight. Reachable only in
	// LAYOUT, so published builds stay byte-inert and never eat input.
	let entered = $state(false);
	let editPose = $state<{ x: number; y: number; w: number; h: number } | null>(null);

	// Tell any nested <Draw> (a group's contents) that it may edit ONLY while
	// this sprite is isolated — so its handles/toolbar never linger on, or ride
	// along with, the flying box. A standalone Draw has no such provider.
	setContext<SpriteIsolation>(SPRITE_ISOLATION_KEY, {
		get entered() {
			return entered;
		}
	});

	function enterIsolation() {
		if (!group || !editing || !browser || !spriteEl) return;
		// Freeze at the CURRENT animated pose, read straight off the running CSS
		// animation, so the box straightens where it is rather than jumping.
		const cs = getComputedStyle(spriteEl);
		editPose = {
			x: parseFloat(cs.left) || base.x,
			y: parseFloat(cs.top) || base.y,
			w: parseFloat(cs.width) || base.w,
			h: parseFloat(cs.height) || base.h
		};
		entered = true;
		// Hand editing to the nested Draw: drop the outer selection so the
		// sprite's own keyframe toolbar steps aside for the inner shape's.
		ctx?.select(null);
	}
	function exitIsolation() {
		entered = false;
		editPose = null;
	}
	// Esc exits; so does turning LAYOUT off underneath an entered sprite.
	$effect(() => {
		if (!entered || !browser) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') exitIsolation();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
	// Click OUTSIDE the isolated group leaves isolation (Illustrator-style), which
	// also tears down the nested Draw's editing chrome (its `editing` gates on our
	// `entered`) — so deselecting by clicking away closes the inner dialog too.
	// Clicks on the sprite content (shapes, handles, the nested toolbar) or the
	// AnimationBar are exempt.
	$effect(() => {
		if (!entered || !browser) return;
		const onDown = (e: PointerEvent) => {
			const t = e.target as Node | null;
			if (t && spriteEl?.contains(t)) return;
			if (t instanceof Element && t.closest('.anim-bar')) return;
			exitIsolation();
		};
		window.addEventListener('pointerdown', onDown, true);
		return () => window.removeEventListener('pointerdown', onDown, true);
	});
	$effect(() => {
		if (!editing && entered) exitIsolation();
	});

	// The frozen, straightened edit pose — no animation, rot 0 — swapped in for
	// baseStyle on .sprite-el while entered.
	const editStyle = $derived(
		editPose
			? `left:${round(editPose.x)}px; top:${round(editPose.y)}px; ` +
					`width:${round(editPose.w)}px; height:${round(editPose.h)}px; ` +
					`transform-origin:${origin}; transform:rotate(0deg);` +
					`${fontFor(editPose.h) != null ? ` font-size:${fontFor(editPose.h)}px;` : ''}`
			: baseStyle
	);

	const animApi: AnimEditor = {
		get stops() {
			const list = liveStops ?? (stops ?? []).map((s, i) => ({ ...s, id: -1 - i }) as IdStop);
			return list
				.map((s) => ({
					id: s.id,
					pct: Math.round(clampPct(s.pct)),
					x: Math.round(finite(s.x)),
					y: Math.round(finite(s.y)),
					w: Math.max(1, Math.round(finite(s.w))),
					h: Math.max(1, Math.round(finite(s.h))),
					rot: Math.round(finite(s.rot ?? 0)),
					ease: s.ease ?? null
				}))
				.sort((a, b) => a.pct - b.pct);
		},
		addStop() {
			const list = materializeStops();
			const asc = [...list].sort((a, b) => finite(a.pct) - finite(b.pct));
			// Insert at the AnimationBar playhead if readable, else the widest gap;
			// geometry is lerped between the bracketing stops so it lands on the path.
			const ph = playheadPercent(spriteEl, animName, animSecs);
			const target = ph != null ? Math.round(ph) : widestGapMid(asc);
			const { a, b, frac } = neighborsAt(asc, target);
			const lerp = (p: number, q: number) => Math.round(p + (q - p) * frac);
			const ns: IdStop = {
				id: stopSeq++,
				pct: target,
				x: lerp(finite(a.x), finite(b.x)),
				y: lerp(finite(a.y), finite(b.y)),
				w: Math.max(1, lerp(finite(a.w), finite(b.w))),
				h: Math.max(1, lerp(finite(a.h), finite(b.h))),
				rot: lerp(finite(a.rot ?? 0), finite(b.rot ?? 0))
			};
			if (a.ease) ns.ease = a.ease; // inherit the split segment's easing
			liveStops = [...list, ns];
		},
		removeStop(id: number) {
			const list = materializeStops();
			if (list.length <= 2) return;
			liveStops = list.filter((s) => s.id !== id);
		},
		setPct(id: number, pct: number) {
			const v = Math.max(0, Math.min(100, Math.round(finite(pct))));
			liveStops = materializeStops().map((s) => (s.id === id ? { ...s, pct: v } : s));
		},
		setEase(id: number, ease: string | null) {
			liveStops = materializeStops().map((s) => {
				if (s.id !== id) return s;
				if (!ease) {
					const { ease: _drop, ...rest } = s;
					return rest as IdStop;
				}
				return { ...s, ease: sanitizeEase(ease) };
			});
		},
		setPose(id: number, key: 'x' | 'y' | 'w' | 'h' | 'rot', value: number) {
			// Same mutation drag uses (setStopGeom), just addressed by id — panel
			// edits stay out of the global undo, matching setPct/setEase.
			const raw = Math.round(finite(value));
			const v = key === 'w' || key === 'h' ? Math.max(1, raw) : raw;
			liveStops = materializeStops().map((s) => (s.id === id ? { ...s, [key]: v } : s));
		},
		preview() {
			const pct = playheadPercent(spriteEl, animName, animSecs);
			if (pct == null) return null;
			return { pct: Math.round(pct), drawn: null };
		}
	};
</script>

<g id={id || undefined} class="draw-sprite {klass}" style={style || undefined}>
	{#if animSecs}
		<!-- Generated keyframes — a real <style>, so it prerenders and scrubs. -->
		{@html `<style>${keyframesCss}</style>`}
	{/if}

	<!-- The moving element lives in HTML space, spanning the canvas so a stop's
	     x/y/w/h are its left/top/width/height with no math. pointer-events:none
	     keeps the surface's never-eats-input guarantee. -->
	<foreignObject
		x="0"
		y="0"
		width={cw}
		height={ch}
		style="overflow:visible; pointer-events:{entered ? 'auto' : 'none'};"
	>
		<div
			xmlns="http://www.w3.org/1999/xhtml"
			class="sprite-layer"
			style="position:absolute; inset:0; pointer-events:{entered ? 'auto' : 'none'}; overflow:visible;"
		>
			<div
				bind:this={spriteEl}
				class="sprite-el"
				class:entered
				style={entered && editPose ? editStyle : baseStyle}
			>
				{@render children?.()}
			</div>
		</div>
	</foreignObject>

	{#if editing && !entered}
		<!-- One ghost per stop: an axis-aligned dashed box (the grab/geometry
		     box) with the stop's percent, plus a short tick showing its rotation.
		     Clicking a box selects the sprite; DOUBLE-clicking enters isolation
		     (freeze + straighten) to edit the nested shapes; when selected, each
		     box grows move / resize / rotate handles. -->
		{#each RS as s, i (i)}
			{@const cxy = center(s)}
			<g class="sprite-ghost" class:selected={isSelected}>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<rect
					class="sprite-hit"
					x={s.x}
					y={s.y}
					width={s.w}
					height={s.h}
					onpointerdown={select}
					ondblclick={enterIsolation}
				/>
				<rect class="sprite-box" x={s.x} y={s.y} width={s.w} height={s.h} />
				<!-- Orientation tick: from center outwards along `rot` (0 = up). -->
				<line
					class="sprite-tick"
					x1={cxy[0]}
					y1={cxy[1]}
					x2={gripPoint(s)[0]}
					y2={gripPoint(s)[1]}
				/>
				<text class="sprite-pct" x={s.x + 6} y={s.y + 22}>{s.pct}%</text>
			</g>
		{/each}
		{#if !isHoisted}{@render chrome()}{/if}
	{/if}

	{#if entered && editPose}
		<!-- Isolation affordance: an upright frame + hint in the OUTER svg (not
		     pointer-inert), marking that the group is frozen/straightened and its
		     nested shapes are now directly editable. Esc exits. -->
		<rect
			class="iso-frame"
			x={editPose.x}
			y={editPose.y}
			width={editPose.w}
			height={editPose.h}
		/>
		<text class="iso-hint" x={editPose.x} y={editPose.y - 12}>▸ group isolated · Esc to exit</text>
	{/if}
</g>

{#snippet chrome()}
	<!-- The selected sprite's per-stop move / resize / rotate handles, wrapped so
	     <Draw> can re-parent them whole into its top layer (select-to-front).
	     They ride absolute canvas coordinates, so lifting them out of their ghost
	     <g> moves nothing. Self-guarding: an UNSELECTED sprite has no handles at
	     all, so this renders nothing while it merely holds the hoist through
	     another shape's drag. -->
	{#if isSelected && !entered}
		<g class="draw-chrome" data-shape={name || 'Sprite'}>
			{#each RS as s, i (i)}
				<DrawHandle
					point={center(s)}
					{grid}
					title={`move · ${s.pct}%`}
					onselect={() => beginDrag(i)}
					onmove={(p) => onMove(i, p)}
					oncommit={() => endDrag(i)}
				/>
				<DrawHandle
					point={corner(s)}
					{grid}
					kind="control"
					title={`resize · ${s.pct}%`}
					onselect={() => beginDrag(i)}
					onmove={(p) => onResize(i, p)}
					oncommit={() => endDrag(i)}
				/>
				<DrawHandle
					point={gripPoint(s)}
					kind="bend"
					title={`rotate · ${s.pct}%`}
					onselect={() => beginDrag(i)}
					onmove={(p) => onRotate(i, p)}
					oncommit={() => endDrag(i)}
				/>
			{/each}
		</g>
	{/if}
{/snippet}

<style>
	.sprite-el {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
		/* Redundant with the inline pointer-events:none, but keep it even if the
		   inline style is ever trimmed — the surface must never eat input. */
		pointer-events: none;
	}
	/* Isolation mode (LAYOUT + double-click only): the frozen, straightened box
	   becomes pointer-live so the nested Draw's own handles/hit-strokes work. */
	.sprite-el.entered {
		pointer-events: auto;
	}

	/* Editing chrome (LAYOUT mode only). */
	.sprite-hit {
		fill: transparent;
		stroke: none;
		pointer-events: all;
		cursor: pointer;
	}
	.sprite-box {
		fill: none;
		stroke: rgba(255, 255, 255, 0.35);
		stroke-width: 2;
		stroke-dasharray: 8 6;
		pointer-events: none;
	}
	.sprite-ghost.selected .sprite-box {
		stroke: var(--ctrl-selected-bg, #00b356);
		stroke-opacity: 0.8;
	}
	.sprite-tick {
		stroke: var(--ctrl-strong-bg, #2980b9);
		stroke-width: 3;
		pointer-events: none;
	}
	.sprite-pct {
		fill: rgba(255, 255, 255, 0.55);
		font-family: 'Fira Code', monospace;
		font-size: 20px;
		pointer-events: none;
		user-select: none;
	}
	/* Isolation affordances. */
	.iso-frame {
		fill: none;
		stroke: var(--ctrl-selected-bg, #00b356);
		stroke-width: 2;
		stroke-dasharray: 10 6;
		pointer-events: none;
	}
	.iso-hint {
		fill: var(--ctrl-selected-bg, #00b356);
		font-family: 'Fira Code', monospace;
		font-size: 20px;
		pointer-events: none;
		user-select: none;
	}
</style>
