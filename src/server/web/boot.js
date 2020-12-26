/**
 * BOOT LOADER
 * サーバーからレスポンスされるHTMLに埋め込まれるスクリプトで、以下の役割を持ちます。
 * - バージョンやユーザーの言語に基づいて適切なメインスクリプトを読み込む。
 * - キャッシュされたコンパイル済みテーマを適用する。
 * - クライアントの設定値に基づいて対応するHTMLクラス等を設定する。
 * テーマをこの段階で設定するのは、メインスクリプトが読み込まれる間もテーマを適用したいためです。
 * 注: webpackは介さないため、このファイルではrequireやimportは使えません。
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔
{
	//#region Script

	//#region Detect language
	const supportedLangs = LANGS;
	let lang = localStorage.getItem('lang');
	if (lang == null || !supportedLangs.includes(lang)) {
		if (supportedLangs.includes(navigator.language)) {
			lang = navigator.language;
		} else {
			lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

			// Fallback
			if (lang == null) lang = 'en-US';
		}
	}
	//#endregion

	const ver = localStorage.getItem('v') || VERSION;

	const salt = localStorage.getItem('salt')
		? `?salt=${localStorage.getItem('salt')}`
		: '';

	const head = document.getElementsByTagName('head')[0];

	const script = document.createElement('script');
	script.setAttribute('src', `/assets/app.${ver}.${lang}.js${salt}`);
	script.setAttribute('async', 'true');
	script.setAttribute('defer', 'true');
	head.appendChild(script);

	// 3秒経ってもスクリプトがロードされない場合はバージョンが古くて
	// 404になっているせいかもしれないので、バージョンを確認して古ければ更新する
	//
	// 読み込まれたスクリプトからこのタイマーを解除できるように、
	// グローバルにタイマーIDを代入しておく
	window.mkBootTimer = window.setTimeout(async () => {
		const res = await fetch('/api/meta', {
			method: 'POST',
			cache: 'no-cache'
		});

		const meta = await res.json();

		if (meta.version != ver) {
			localStorage.setItem('v', meta.version);
			alert(
				'Misskeyの新しいバージョンがあります。ページを再度読み込みします。' +
				'\n\n' +
				'New version of Misskey available. The page will be reloaded.');
			refresh();
		}
	}, 3000);
	//#endregion

	//#region Theme
	const theme = localStorage.getItem('theme');
	if (theme) {
		for (const [k, v] of Object.entries(JSON.parse(theme))) {
			document.documentElement.style.setProperty(`--${k}`, v.toString());

			// HTMLの theme-color 適用
			if (k === 'htmlThemeColor') {
				for (const tag of document.head.children) {
					if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
						tag.setAttribute('content', v);
						break;
					}
				}
			}
		}
	}
	//#endregion

	const fontSize = localStorage.getItem('fontSize');
	if (fontSize) {
		document.documentElement.classList.add('f-' + fontSize);
	}

	const useSystemFont = localStorage.getItem('useSystemFont');
	if (useSystemFont) {
		document.documentElement.classList.add('useSystemFont');
	}

	// eslint-disable-next-line no-inner-declarations
	function refresh() {
		// Random
		localStorage.setItem('salt', Math.random().toString().substr(2, 8));

		// Clear cache (service worker)
		try {
			navigator.serviceWorker.controller.postMessage('clear');
			navigator.serviceWorker.getRegistrations().then(registrations => {
				registrations.forEach(registration => registration.unregister());
			});
		} catch (e) {
			console.error(e);
		}

		location.reload();
	}
}
