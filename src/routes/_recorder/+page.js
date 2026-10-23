// The VOD Recorder window — outside every deck layout, because it must never navigate
// (see specs/VOD-RECORD-1.md). Prerendered shell; the deck comes from `?deck=` on mount.
export const prerender = true;
export const trailingSlash = 'never';
