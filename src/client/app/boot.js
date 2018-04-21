/**
 * MISSKEY BOOT LOADER
 * (ENTRY POINT)
 */

/**
 * ドメインに基づいて適切なスクリプトを読み込みます。
 * ユーザーの言語およびモバイル端末か否かも考慮します。
 * webpackは介さないためrequireやimportは使えません。
 */

'use strict';

(function() {
	// キャッシュ削除要求があれば従う
	if (localStorage.getItem('shouldFlush') == 'true') {
		refresh();
		return;
	}

	// Get the current url information
	const url = new URL(location.href);

	//#region Detect app name
	let app = null;

	if (url.pathname == '/docs') app = 'docs';
	if (url.pathname == '/dev') app = 'dev';
	if (url.pathname == '/auth') app = 'auth';
	//#endregion

	// Detect the user language
	// Note: The default language is Japanese
	let lang = navigator.language.split('-')[0];
	if (!/^(en|ja)$/.test(lang)) lang = 'ja';
	if (localStorage.getItem('lang')) lang = localStorage.getItem('lang');

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

	// Dark/Light
	const me = JSON.parse(localStorage.getItem('me') || null);
	if (me && me.clientSettings) {
		if ((app == 'desktop' && me.clientSettings.dark) || (app == 'mobile' && me.clientSettings.darkMobile)) {
			document.documentElement.setAttribute('data-darkmode', 'true');
		}
	}

	// Script version
	const ver = localStorage.getItem('v') || VERSION;

	// Whether in debug mode
	const isDebug = localStorage.getItem('debug') == 'true';

	// Whether use raw version script
	const raw = (localStorage.getItem('useRawScript') == 'true' && isDebug)
		|| ENV != 'production';

	// Load an app script
	// Note: 'async' make it possible to load the script asyncly.
	//       'defer' make it possible to run the script when the dom loaded.
	const script = document.createElement('script');
	script.setAttribute('src', `/assets/${app}.${ver}.${lang}.${raw ? 'raw' : 'min'}.js`);
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
		const res = await fetch(API + '/meta', {
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

		// Clear cache (serive worker)
		try {
			navigator.serviceWorker.controller.postMessage('clear');

			navigator.serviceWorker.getRegistrations().then(registrations => {
				registrations.forEach(registration => registration.unregister());
			});
		} catch (e) {
			console.error(e);
		}

		// Force reload
		setTimeout(() => {
			location.reload(true);
		}, 1000);
	}
})();
