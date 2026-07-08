// Web Animations helpers for a slide's finite CSS @keyframes animations — the
// shared core behind the presenter's ANIMATE control (which reads/drives the
// local slide's animations for its rail) and the audience-side applier that
// replays a relayed {playing, fraction} command onto its own slide. Mirrors the
// scoping/filtering AnimationBar does internally; kept pure of Svelte so both
// sides use one implementation.

/** The relayed animation state: is it playing, and where in its 0..1 envelope. */
export interface AnimState {
	playing: boolean;
	fraction: number;
}

/** Wall-clock end of an animation (delay + active duration [+ end delay]); 0 for
    anything without a finite, numeric end (filtered out — not seekable). */
export function endTimeOf(a: Animation): number {
	const e = a.effect?.getComputedTiming().endTime;
	return typeof e === 'number' && Number.isFinite(e) ? e : 0;
}

/** Every finite, seekable CSS @keyframes animation in `scope` — excluding CSS
    *transitions* (Box/WideDiv) and infinite loops, which have no playable timeline. */
export function collectFinite(scope: Element | Document): Animation[] {
	const all = scope.getAnimations({ subtree: true });
	return all.filter((a) => {
		if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) return false;
		return endTimeOf(a) > 0;
	});
}

/** Envelope length in ms (max end time across the group). */
export function envelope(anims: Animation[]): number {
	return anims.reduce((m, a) => Math.max(m, endTimeOf(a)), 0);
}

/** Live playhead as a 0..1 fraction — the furthest-advanced animation, each capped
    at its own end so a short early one can't peg the bar before the long one ends. */
export function sampleFraction(anims: Animation[]): number {
	const dur = envelope(anims);
	if (dur <= 0) return 0;
	let t = 0;
	for (const a of anims) {
		const ct = typeof a.currentTime === 'number' ? a.currentTime : 0;
		t = Math.max(t, Math.min(ct, endTimeOf(a)));
	}
	return Math.max(0, Math.min(1, t / dur));
}

/** True while any animation in the group is attached to the clock and advancing. */
export function isPlaying(anims: Animation[]): boolean {
	return anims.some((a) => a.playState === 'running');
}

/** Seek the group to `fraction` (each animation clamped to its own end so staggered
    delays settle coherently), then play or pause the whole group to match `playing`. */
export function applyState(anims: Animation[], state: AnimState): void {
	const dur = envelope(anims);
	const t = Math.max(0, Math.min(1, state.fraction)) * dur;
	for (const a of anims) a.currentTime = Math.min(t, endTimeOf(a));
	if (state.playing) for (const a of anims) a.play();
	else for (const a of anims) a.pause();
}
