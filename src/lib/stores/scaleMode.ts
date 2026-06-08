import { writable } from 'svelte/store';
import { browser } from '$app/environment';

let initialScaleMode = true;

if (browser) {
    const storedScaleMode = localStorage.getItem('scaleMode');
    if (storedScaleMode !== null) {
        initialScaleMode = storedScaleMode === 'true';
    } else {
        localStorage.setItem('scaleMode', 'true');
    }
}

export const scaleMode = writable(initialScaleMode);

if (browser) {
    scaleMode.subscribe((value) => {
        localStorage.setItem('scaleMode', value.toString());
    });
}
