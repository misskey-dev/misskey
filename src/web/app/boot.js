/**
 * MISSKEY BOOT LOADER
 * (ENTRY POINT)
 */

/**
 * ドメインに基づいて適切なスクリプトを読み込みます。
 * ユーザーの言語およびモバイル端末か否かも考慮します。
 */

'use strict';

// Get the current url information
const Url = new URL(location.href);

// Extarct the (sub) domain part of the current url
//
// e.g.
//   misskey.alice               => misskey
//   misskey.strawberry.pasta    => misskey
//   dev.misskey.alice.tachibana => dev
let app = Url.host.split('.')[0];

// Detect the user language
// Note: The default language is English
let lang = navigator.language.split('-')[0];
if (!/^(en|ja)$/.test(lang)) lang = 'en';

// Detect the user agent
const ua = navigator.userAgent.toLowerCase();
const isMobile = /mobile|iphone|ipad|android/.test(ua);

// Get the <head> element
const [head] = document.getElementsByTagName('head');

// If mobile, insert the viewport meta tag
if (isMobile) {
	const meta = document.createElement('meta');
	meta.setAttribute('name', 'viewport');
	meta.setAttribute('content', [
		['width', 'device-width'],
		['initial-scale', '1'],
		['minimum-scale', '1'],
		['maximum-scale', '1'],
		['user-scalable', 'no']
	].map(x => x.join('=')).join(','));
	head.appendChild(meta);
}

// Switch desktop or mobile version
if (app == 'misskey') {
	app = isMobile ? 'mobile' : 'desktop';
}

// Load an app script
// Note: 'async' makes can load the script asyncly.
//       'defer' makes can run script when the dom loaded.
const script = document.createElement('script');
script.setAttribute('src', `/assets/${app}.${VERSION}.${lang}.js`);
script.setAttribute('async', 'true');
script.setAttribute('defer', 'true');
head.appendChild(script);
