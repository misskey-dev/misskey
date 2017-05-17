/**
 * MISSKEY ENTRY POINT
 */

const Url = new URL(location.href);

let app = Url.host.split('.')[0];

// Detect user language
let lang = navigator.language.split('-')[0];
if (!/^(en|ja)$/.test(lang)) lang = 'en';

// Detect user agent
const ua = navigator.userAgent.toLowerCase();
const isMobile = /mobile|iphone|ipad|android/.test(ua);

const head = document.getElementsByTagName('head')[0];

if (isMobile) {
	const meta = document.createElement('meta');
	meta.setAttribute('name', 'viewport');
	meta.setAttribute('content', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no');
	head.appendChild(meta);
}

if (app == 'misskey') {
	app = isMobile ? 'mobile' : 'desktop';
}

// Load app script
const script = document.createElement('script');
script.setAttribute('src', `/assets/${app}.${VERSION}.${lang}.js`);
script.setAttribute('async', 'true');
script.setAttribute('defer', 'true');
head.appendChild(script);
