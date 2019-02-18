/**
 * MISSKEY BOOT LOADER
 * (ENTRY POINT)
 */

'use strict';

(async function() {
	// キャッシュ削除要求があれば従う
	if (localStorage.getItem('shouldFlush') == 'true') {
		refresh();
		return;
	}

	const langs = LANGS;

	//#region Apply theme
	const theme = localStorage.getItem('theme');
	if (theme) {
		for (const [k, v] of Object.entries(JSON.parse(theme))) {
			document.documentElement.style.setProperty(`--${k}`, v.toString());
		}
	}
	//#endregion

	//#region Load settings
	let settings = null;
	const vuex = localStorage.getItem('vuex');
	if (vuex) {
		settings = JSON.parse(vuex);
	}
	//#endregion

	// Get the current url information
	const url = new URL(location.href);

	//#region Detect app name
	let app = null;

	if (`${url.pathname}/`.startsWith('/docs/')) app = 'docs';
	if (`${url.pathname}/`.startsWith('/dev/')) app = 'dev';
	if (`${url.pathname}/`.startsWith('/auth/')) app = 'auth';
	if (`${url.pathname}/`.startsWith('/admin/')) app = 'admin';
	if (`${url.pathname}/`.startsWith('/test/')) app = 'test';
	//#endregion

	// Script version
	const ver = localStorage.getItem('v') || VERSION;

	//#region Detect the user language
	let lang = null;

	if (langs.includes(navigator.language)) {
		lang = navigator.language;
	} else {
		lang = langs.find(x => x.split('-')[0] == navigator.language);

		if (lang == null) {
			// Fallback
			lang = 'en-US';
		}
	}

	if (settings && settings.device.lang &&
		langs.includes(settings.device.lang))
	{
		lang = settings.device.lang;
	}

	localStorage.setItem('lang', lang);
	//#endregion

	//#region Fetch locale data
	const cachedLocale = localStorage.getItem('locale');
	const localeKey = localStorage.getItem('localeKey');

	if (cachedLocale == null || localeKey != `${ver}.${lang}`) {
		const locale = await fetch(`/assets/locales/${lang}.json?ver=${ver}`)
			.then(response => response.json());

		localStorage.setItem('locale', JSON.stringify(locale));
		localStorage.setItem('localeKey', `${ver}.${lang}`);
	}
	//#endregion

	// Detect the user agent
	const ua = navigator.userAgent.toLowerCase();
	const isMobile = /mobile|iphone|ipad|android/.test(ua);

	// Get the <head> element
	const head = document.getElementsByTagName('head')[0];

	// If mobile, insert the viewport meta tag
	if (isMobile) {
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'viewport');
		meta.setAttribute('content',
			'width=device-width,' +
			'initial-scale=1,' +
			'minimum-scale=1,' +
			'maximum-scale=1,' +
			'user-scalable=no');
		head.appendChild(meta);
	}

	// Switch desktop or mobile version
	if (app == null) {
		app = isMobile ? 'mobile' : 'desktop';
	}

	// Get salt query
	const salt = localStorage.getItem('salt')
		? `?salt=${localStorage.getItem('salt')}`
		: '';

	// Load an app script
	// Note: 'async' make it possible to load the script asyncly.
	//       'defer' make it possible to run the script when the dom loaded.
	const script = document.createElement('script');
	script.setAttribute('src', `/assets/${app}.${ver}.js${salt}`);
	script.setAttribute('async', 'true');
	script.setAttribute('defer', 'true');
	head.appendChild(script);

	// 3秒経ってもスクリプトがロードされない場合はバージョンが古くて
	// 404になっているせいかもしれないので、バージョンを確認して古ければ更新する
	//
	// 読み込まれたスクリプトからこのタイマーを解除できるように、
	// グローバルにタイマーIDを代入しておく
	window.mkBootTimer = window.setTimeout(async () => {
		// Fetch meta
		const res = await fetch('/api/meta', {
			method: 'POST',
			cache: 'no-cache'
		});

		// Parse
		const meta = await res.json();

		// Compare versions
		if (meta.version != ver) {
			localStorage.setItem('v', meta.version);

			alert(
				'Misskeyの新しいバージョンがあります。ページを再度読み込みします。' +
				'\n\n' +
				'New version of Misskey available. The page will be reloaded.');

			refresh();
		}
	}, 3000);

	function refresh() {
		localStorage.setItem('shouldFlush', 'false');

		localStorage.removeItem('locale');

		// Random
		localStorage.setItem('salt', Math.random().toString().substr(2, 8));

		// Clear cache (service worker)
		try {
			navigator.serviceWorker.controller.postMessage('clear');

			navigator.serviceWorker.getRegistrations().then(registrations => {
				for (const registration of registrations) registration.unregister();
			});
		} catch (e) {
			console.error(e);
		}

		// Force reload
		location.reload(true);
	}
})();
