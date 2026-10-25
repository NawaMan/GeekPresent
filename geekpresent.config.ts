// This site's settings — read by the Vite plugin (vite.config.ts) and the test configs.
// Every field is optional; see src/lib/config/siteConfigCore.ts for what each one does
// and what it defaults to.
import type { GeekPresentConfig } from './src/lib/config/siteConfigCore';

const site: GeekPresentConfig = {
	// UNSET env GEEKPRESENT_SITE_URL -> this; set it (even to '') to override per deploy.
	siteUrl: 'https://nawaman.github.io/GeekPresent',
	siteName: 'GeekPresent',
	siteDescription:
		'Build presentation slides and long-form texts in HTML, CSS and Svelte — each slide a route, each component yours, all in a portable static site.',
	ogImageAlt: 'GeekPresent — presentation slides and long-form texts in HTML, CSS and Svelte.',
	copyright: { name: 'GeekPresent', url: 'https://nawaman.net/projects#geekpresent' },
	// trailingSlash is "never", so '/' is the only one that keeps a trailing slash.
	textRoutes: ['/', '/text.html', '/seo.html']
};

export default site;
