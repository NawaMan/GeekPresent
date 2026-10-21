// The seam between a <Group> and the Blocks (and nested Groups) inside it.
//
// A Group publishes these through Svelte context:
//   - `frame`: its members' local → CANVAS map (already composed with every
//     enclosing group), which a Block applies to draw itself;
//   - `hidden` / `morph`: which members this slide hides, and the prefix their
//     View-Transition names wear — both inherited down nested groups;
//   - `register` / `withdraw`: where a named member reports its LOCAL box, so a
//     camera can `fit` or `focus` on it by name. A nested group forwards its
//     members up, mapped into the parent's space, so an outer camera can aim at a
//     part that lives in an inner group.
//
// No group above → `getGroup()` is null and a Block draws exactly as it always
// has. That is the compatibility promise: nothing outside a <Group> changes.
import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';
import type { Box, Frame, HideState } from './groupCore';

export interface GroupContext {
	/** Members' local → canvas map. */
	frame: Readable<Frame>;
	/** Which members this slide hides (the group's `hide`, and its ancestors'). */
	hidden: Readable<HideState>;
	/** The morph-name prefix members wear (`data-gp-morph="<prefix>-<name>"`), or null. */
	morph: Readable<string | null>;
	/** Report (or update) a named member's box, in this group's local space. */
	register(key: object, name: string, box: Box): void;
	/** Forget a member (unmounted, deleted, or renamed to ''). */
	withdraw(key: object): void;
}

const KEY = Symbol('gp-group');

export function setGroup(ctx: GroupContext): void {
	setContext(KEY, ctx);
}

/** The nearest enclosing group, or null outside any. */
export function getGroup(): GroupContext | null {
	return getContext<GroupContext | undefined>(KEY) ?? null;
}
