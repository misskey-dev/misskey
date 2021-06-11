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
		renderError('SOMETHING_HAPPENED', e.toString());
	};
	window.onunhandledrejection = (e) => {
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e.toString());
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
		} else if (localeOutdated) {
			// nop
		} else {
			renderError('LOCALE_FETCH_FAILED');
			checkUpdate();
			return;
		}
	}
	//#endregion

	//#region Script
	const salt = localStorage.getItem('salt')
		? `?salt=${localStorage.getItem('salt')}`
		: '';

	const head = document.getElementsByTagName('head')[0];

	const script = document.createElement('script');
	script.setAttribute('src', `/assets/app.${v}.js${salt}`);
	script.setAttribute('async', 'true');
	script.setAttribute('defer', 'true');
	script.addEventListener('error', async () => {
		renderError('APP_FETCH_FAILED');
		checkUpdate();
	});
	head.appendChild(script);
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

	// eslint-disable-next-line no-inner-declarations
	function renderError(code, details) {
		document.documentElement.innerHTML = `
			<h1>⚠有严重错误发生了！</h1>
			<p>请先尝试以下方法，如果问题依旧无法解决，请联系管理员!</p>
			<ul>
				<li>😞尝试修复<a href="/bios">BIOS</a>，非专业人士请勿尝试</li>
				<li>😃尝试<a href="/flush">刷新缓存</a></li>
				<li>😉尝试使用最新版Chrome,Firefox,Chromium,Edge,Safari等浏览器</li>
			</ul>
			<hr>
			<code>ERROR CODE: ${code}</code>
			<details>
				${details}
			</details>
		`;
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
			alert(
				'Misskey的新版本出来了，此页面需要重载！😃' +
				'\n\n' +
				'New version of Misskey available. The page will be reloaded.');
			refresh();
		}
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
})();
