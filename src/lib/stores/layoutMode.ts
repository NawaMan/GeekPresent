import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// LAYOUT mode — an AUTHORING aid, not a viewer feature. When on, <Block>
// wrappers expose drag + resize handles so you can position elements by hand at
// exact canvas pixels, then Copy the resulting tag back into source. Nothing is
// saved: it only helps you *find* coordinates to paste yourself.
//
// Two stores:
//   - layoutMode: is the mode currently on? Persisted, so it survives the full
//     page reload between slides (each slide is its own route).
//   - canLayout:  is the LAYOUT control even available here? True in `vite dev`
//     always; in any built site it's OFF unless a slide is opened with `?layout`
//     (sticky once seen, like the existing `?clean` flag), so the deployed public
//     deck never shows it. `?layout=off` clears it again.

const MODE_KEY = 'layoutMode';
const CAN_KEY = 'canLayout';

function initialMode(): boolean {
    if (!browser) return false;
    return localStorage.getItem(MODE_KEY) === 'true';
}

function initialCan(): boolean {
    if (import.meta.env.DEV) return true;
    if (!browser) return false;
    return localStorage.getItem(CAN_KEY) === 'true';
}

export const layoutMode = writable<boolean>(initialMode());
export const canLayout = writable<boolean>(initialCan());

if (browser) {
    layoutMode.subscribe((v) => localStorage.setItem(MODE_KEY, String(v)));
}

/** Opt the LAYOUT control in/out from a slide URL's `?layout` flag, then remember
    it across navigations (the flag is dropped by the nav links, so we persist it).
    `?layout` / `?layout=on` enables; `?layout=off` disables and exits the mode. */
export function applyLayoutParam(url: URL): void {
    if (!browser || !url.searchParams.has('layout')) return;
    const v = url.searchParams.get('layout');
    const on = v !== 'off' && v !== 'false' && v !== '0';
    localStorage.setItem(CAN_KEY, String(on));
    canLayout.set(import.meta.env.DEV || on);
    if (!on) layoutMode.set(false);
}
