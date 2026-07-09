import { writable } from 'svelte/store';

// The <Steps> build currently driving this slide, published for the chrome.
//
// Steps sits inside the slide's content while NavigationBar is rendered by the
// page template (ContentPage/TitlePage) — they are SIBLINGS, so Svelte context
// can't reach from one to the other. This module-level store is the bridge, the
// same trick selectedBlock uses for the LAYOUT-mode selection.
//
// A Steps with keyboard stepping on (keys='global') registers itself here and
// keeps `hasNext` in sync as the build advances; NavigationBar reads it to enable
// the CONTINUE button and to make clicking it do exactly what Space does. `null`
// = no build on this slide, so CONTINUE falls back to the slide's own onContinue
// hook (and stays disabled when there is none).
//
// One build at a time: `owner` identifies the registering instance so a Steps
// only clears the store on destroy if it is still the one holding it.
export type ActiveSteps = {
	/** Identity of the registering Steps instance. */
	owner: object;
	/** Is there another Fragment left to reveal? */
	hasNext: boolean;
	/** Is there a revealed Fragment left to peel back off? */
	hasPrev: boolean;
	/** Reveal the next Fragment — the same action as pressing Space. */
	next: () => void;
};

export const activeSteps = writable<ActiveSteps | null>(null);
