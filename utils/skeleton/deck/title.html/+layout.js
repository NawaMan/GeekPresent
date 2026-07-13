// Every slide dir needs this. `never` is not cosmetic: the deck addresses slides
// as /<deck>/title.html, and without it SvelteKit redirects to the trailing-slash
// form, which the nav links do not use — the slide 404s.
export const prerender = true;
export const trailingSlash = "never";
