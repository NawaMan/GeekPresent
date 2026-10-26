// The project's settings (config/siteConfigCore.ts): what a site that uses GeekPresent
// changes INSTEAD of editing framework files. Resolved once by the Vite plugin, so the
// rules here are the whole contract — defaults, the env override, and junk falling back.
import { describe, expect, it } from 'vitest';
import {
	DEFAULTS,
	drawModule,
	normalizeSiteUrl,
	resolveConfig
} from '../src/lib/config/siteConfigCore';
import { configDefine } from '../src/lib/vite';
import site from '../geekpresent.config';

describe('resolveConfig', () => {
	it('fills every field a project leaves out', () => {
		expect(resolveConfig()).toEqual(DEFAULTS);
		expect(resolveConfig({ siteName: 'Mine' })).toEqual({ ...DEFAULTS, siteName: 'Mine', siteTitle: 'Mine' });
	});

	it('takes siteTitle on its own when set, else follows siteName', () => {
		expect(resolveConfig({ siteName: 'Blog', siteTitle: 'The Blog' }).siteTitle).toBe('The Blog');
		expect(resolveConfig({ siteName: 'Blog' }).siteTitle).toBe('Blog');
		expect(resolveConfig({ siteTitle: 7 } as never).siteTitle).toBe(DEFAULTS.siteName);
	});

	it('keeps a copyright half the project did not set', () => {
		const c = resolveConfig({ copyright: { name: 'Me' } }).copyright;
		expect(c).toEqual({ name: 'Me', url: DEFAULTS.copyright.url });
	});

	it('lets GEEKPRESENT_SITE_URL override siteUrl — even when set to empty', () => {
		expect(resolveConfig({ siteUrl: 'https://a.test' }).siteUrl).toBe('https://a.test');
		expect(resolveConfig({ siteUrl: 'https://a.test' }, 'https://b.test').siteUrl).toBe('https://b.test');
		// '' means "no base URL": the absolute-only SEO tags are omitted.
		expect(resolveConfig({ siteUrl: 'https://a.test' }, '').siteUrl).toBe('');
	});

	it('trims the site URL and drops trailing slashes', () => {
		expect(resolveConfig({ siteUrl: ' https://a.test/// ' }).siteUrl).toBe('https://a.test');
		expect(normalizeSiteUrl('https://a.test/x/')).toBe('https://a.test/x');
	});

	it('falls back on junk rather than leaking it into the page', () => {
		const junk = { siteName: 42, textRoutes: 'nope', copyright: { url: null } } as never;
		const r = resolveConfig(junk);
		expect(r.siteName).toBe(DEFAULTS.siteName);
		expect(r.textRoutes).toEqual(DEFAULTS.textRoutes);
		expect(r.copyright.url).toBe(DEFAULTS.copyright.url);
		expect(resolveConfig({ textRoutes: ['/', 7 as never, '/a.html'] }).textRoutes).toEqual(['/', '/a.html']);
	});

	it('does not share the textRoutes array with the caller', () => {
		const routes = ['/'];
		resolveConfig({ textRoutes: routes }).textRoutes.push('/x');
		expect(routes).toEqual(['/']);
	});
});

describe('libImport — how a slide reaches the framework', () => {
	it('is $lib here, and whatever the plugin says elsewhere', () => {
		expect(resolveConfig().libImport).toBe('$lib');
		expect(resolveConfig({}, undefined, '@geekpresent/core').libImport).toBe('@geekpresent/core');
		expect(resolveConfig({ libImport: '$gp/' }, undefined, '@geekpresent/core').libImport).toBe('$gp');
	});

	it('names the draw module a frozen shape imports', () => {
		expect(drawModule({ libImport: '$lib' })).toBe('$lib/draw');
		expect(drawModule({ libImport: '@geekpresent/core' })).toBe('@geekpresent/core/draw');
	});
});

describe('configDefine — the plugin injects it, the test configs too', () => {
	it('injects the resolved settings as one JSON literal', () => {
		const define = configDefine(site, 'https://example.test');
		const injected = JSON.parse(define.__GEEKPRESENT_CONFIG__);
		expect(injected.siteUrl).toBe('https://example.test');
		expect(injected.siteName).toBe(site.siteName);
		// Loaded from src/, not node_modules — so this repo's slides keep '$lib'.
		expect(injected.libImport).toBe('$lib');
	});
});
