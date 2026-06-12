// Page-level favicon override: the deck shell emits the current slide's favicon at
// SSR, so this overrides the site default for just the hook.html slide. The other
// tall slides keep the site favicon (static/favicon.png).
import zoomFavicon from '$lib/assets/codecat-zoom.png';

export const pages = [
    { path: "title.html",     title: "Title" },
    { path: "hook.html",      title: "The Hook", favicon: zoomFavicon },
    { path: "thank-you.html", title: "Thank You" },
];
