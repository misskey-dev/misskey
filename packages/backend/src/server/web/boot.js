/**
 * BOOT LOADER
 * サーバーからレスポンスされるHTMLに埋め込まれるスクリプトで、以下の役割を持ちます。
 * - 翻訳ファイルをフェッチする。
 * - バージョンに基づいて適切なメインスクリプトを読み込む。
 * - キャッシュされたコンパイル済みテーマを適用する。
 * - クライアントの設定値に基づいて対応するHTMLクラス等を設定する。
 * テーマをこの段階で設定するのは、メインスクリプトが読み込まれる間もテーマを適用したいためです。
 * 注: webpackは介さないため、このファイルではrequireやimportは使えません。
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e);
	};

	const v = localStorage.getItem('v') || VERSION;

	//#region Detect language & fetch translations
	const localeVersion = localStorage.getItem('localeVersion');
	const localeOutdated = (localeVersion == null || localeVersion !== v);

	if (!localStorage.hasOwnProperty('locale') || localeOutdated) {
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

		const res = await fetch(`/assets/locales/${lang}.${v}.json`);
		if (res.status === 200) {
			localStorage.setItem('lang', lang);
			localStorage.setItem('locale', await res.text());
			localStorage.setItem('localeVersion', v);
		} else {
			await checkUpdate();
			renderError('LOCALE_FETCH_FAILED');
			return;
		}
	}
	//#endregion

	//#region Script
	import(`/assets/${CLIENT_ENTRY}`)
		.catch(async e => {
			await checkUpdate();
			renderError('APP_FETCH_FAILED', e);
		})
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

	const wallpaper = localStorage.getItem('wallpaper');
	if (wallpaper) {
		document.documentElement.style.backgroundImage = `url(${wallpaper})`;
	}

	const customCss = localStorage.getItem('customCss');
	if (customCss && customCss.length > 0) {
		const style = document.createElement('style');
		style.innerHTML = customCss;
		document.head.appendChild(style);
	}

	// eslint-disable-next-line no-inner-declarations
	function renderError(code, details) {
		let errorsElement = document.getElementById('errors');
		if (!errorsElement) {
			document.documentElement.innerHTML = `
			<h1>⚠ An error has occurred. ⚠</h1>
			<p>If the problem persists, please contact the administrator. You may also try the following options:</p>
			<ul>
				<li>Start <a href="/cli">the simple client</a></li>
				<li>Attempt to repair in <a href="/bios">BIOS</a></li>
				<li><a href="/flush">Flush preferences and cache</a></li>
			</ul>
			<hr>
			<div id="errors"></div>
			`;

			errorsElement = document.getElementById('errors');
		}

		const detailsElement = document.createElement('details');
		detailsElement.innerHTML = `<summary><code>ERROR CODE: ${code}</code></summary>${JSON.stringify(details)}`;

		errorsElement.appendChild(detailsElement);
	}

	// eslint-disable-next-line no-inner-declarations
	async function checkUpdate() {
		// TODO: サーバーが落ちている場合などのエラーハンドリング
		const res = await fetch('/api/meta', {
			method: 'POST',
			cache: 'no-cache'
		});

		const meta = await res.json();

		if (meta.version != v) {
			localStorage.setItem('v', meta.version);
			refresh();
		}
	}

	// eslint-disable-next-line no-inner-declarations
	function refresh() {
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
})();
