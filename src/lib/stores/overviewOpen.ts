import { writable } from 'svelte/store';

// Is the all-slides OVERVIEW grid open? A store, not OverviewPage-local state, because two
// things now open it and they must agree: the `o` key (owned by OverviewPage itself) and the
// OVERVIEW item in ANNOTATE's tool flyout (owned by SlideDeck, a different component that has no
// other handle on the grid). One boolean, set from either side, read by the grid.
//
// Not persisted: an overview that was open when you left should not reopen itself on the next
// slide load. It is a momentary "where do I want to go" gesture, closed the instant you pick.
export const overviewOpen = writable(false);
