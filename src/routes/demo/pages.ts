// Per-page favicon (optional): import the colocated asset so Vite bundles it, then
// attach it to the page entry. The deck shell emits it — see demo/+layout.svelte.
import thankYouFavicon from './thank-you.html/favicon.svg';

export const pages = [
    { path: "title.html",     title: "Title" },
    { path: "about.html",     title: "About this demo" },
    { path: "theme.html",     title: "Its own theme" },
    { path: "features.html",  title: "Components" },
    { path: "thank-you.html", title: "Thank You", favicon: thankYouFavicon },
];
