// Which view-transition KIND a page turn uses (the value of html[data-vt-kind]).
//
// Pure: no DOM, no stores. NavigationBar, the presenter console and SlideDeck's
// follower and replay all ask here, so a click, a followed turn and a replayed one
// pick the same kind.
//
// Forward, the kind is the LEAVING slide's `transition`.
// Back, it is the leaving slide's `transitionBack` when it names one. When it does
// not, the turn undoes the one that leads forward into this slide: the `transition`
// of the slide we are going back TO, reversed when that kind has a direction
// (left <-> right, rise <-> fall). A kind with no direction is its own reverse:
// html[data-vt="back"] already tells its CSS which way to play.

export type TurnDirection = 'forward' | 'back';

/** What the function reads of a pages.ts entry. */
export interface TransitionPage {
	path: string;
	transition?: string;
	transitionBack?: string;
}

/** The kind used when a slide names none. */
export const DEFAULT_KIND = 'slide';

/** The built-in kinds that have a direction, each with its reverse. Their keyframes
    are styles/push-transitions.css. */
export const BUILT_IN_REVERSE: Readonly<Record<string, string>> = Object.freeze({
	left: 'right',
	right: 'left',
	rise: 'fall',
	fall: 'rise'
});

const isKind = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

/** The kind that undoes `kind`. `reverses` is the deck's own map; it is read before
    the built-in pairs, and a kind in neither is its own reverse. */
export function reverseKind(kind: string, reverses?: Record<string, string> | null): string {
	const own =
		reverses && Object.prototype.hasOwnProperty.call(reverses, kind) ? reverses[kind] : undefined;
	if (isKind(own)) return own;
	const builtIn = Object.prototype.hasOwnProperty.call(BUILT_IN_REVERSE, kind)
		? BUILT_IN_REVERSE[kind]
		: undefined;
	return builtIn ?? kind;
}

/** The slide name at the end of an href or pathname: "./a.html?present" -> "a.html". */
export function slideOfHref(href: unknown): string {
	if (typeof href !== 'string') return '';
	const bare = href.split(/[?#]/)[0].replace(/\/+$/, '');
	return bare.split('/').pop() ?? '';
}

/** The kind for a turn from the slide `from` to the slide `to` (slide names or hrefs). */
export function turnKind(
	pages: ReadonlyArray<TransitionPage>,
	from: string,
	to: string | null | undefined,
	direction: TurnDirection,
	reverses?: Record<string, string> | null
): string {
	const fromPath = slideOfHref(from);
	const leaving = pages.find((p) => p.path === fromPath);
	if (direction !== 'back') return isKind(leaving?.transition) ? leaving.transition : DEFAULT_KIND;
	if (isKind(leaving?.transitionBack)) return leaving.transitionBack;
	const toPath = slideOfHref(to);
	const target = toPath ? pages.find((p) => p.path === toPath) : undefined;
	const into = isKind(target?.transition) ? target.transition : DEFAULT_KIND;
	return reverseKind(into, reverses);
}
