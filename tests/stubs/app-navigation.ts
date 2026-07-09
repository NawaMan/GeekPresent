// Stub for SvelteKit's `$app/navigation` in the standalone vitest projects (no Kit
// runtime there). Components that page the deck (NavigationBar → utils/deckNav) or
// re-arm on navigation (AnimationBar, PresenterAnim) import this at module scope,
// so it has to resolve even in tests that never navigate. Both are inert no-ops:
// `goto` resolves without moving, `afterNavigate` never fires its callback.
export function goto(): Promise<void> {
	return Promise.resolve();
}
export function afterNavigate(): void {}
export function beforeNavigate(): void {}
export function invalidateAll(): Promise<void> {
	return Promise.resolve();
}
