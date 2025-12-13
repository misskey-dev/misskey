/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED');
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE');
	};

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.');
		return;
	}

	// パラメータに応じてsplashのスタイルを変更
	const params = new URLSearchParams(location.search);
	if (params.has('rounded') && params.get('rounded') === 'false') {
		document.documentElement.classList.add('norounded');
	}
	if (params.has('border') && params.get('border') === 'false') {
		document.documentElement.classList.add('noborder');
	}

	//#region Detect language & fetch translations
	const supportedLangs = LANGS;
	/** @type { string } */
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

	// for https://github.com/misskey-dev/misskey/issues/10202
	if (lang == null || lang.toString == null || lang.toString() === 'null') {
		console.error('invalid lang value detected!!!', typeof lang, lang);
		lang = 'en-US';
	}
	//#endregion

	//#region Script
	async function importAppScript() {
		await import(CLIENT_ENTRY ? `/embed_vite/${CLIENT_ENTRY.replace('scripts', lang)}` : '/embed_vite/src/boot.ts')
			.catch(async e => {
				console.error(e);
				renderError('APP_IMPORT');
			});
	}

	// タイミングによっては、この時点でDOMの構築が済んでいる場合とそうでない場合とがある
	if (document.readyState !== 'loading') {
		importAppScript();
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			importAppScript();
		});
	}

	localStorage.setItem('lang', lang);
	//#endregion

	async function addStyle(styleText) {
		let css = document.createElement('style');
		css.appendChild(document.createTextNode(styleText));
		document.head.appendChild(css);
	}

	async function renderError(code) {
		// Cannot set property 'innerHTML' of null を回避
		if (document.readyState === 'loading') {
			await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
		}

		let messages = null;
		const bootloaderLocales = localStorage.getItem('bootloaderLocales');
		if (bootloaderLocales) {
			messages = JSON.parse(bootloaderLocales);
		}
		if (!messages) {
			// older version of misskey does not store bootloaderLocales, stores locale as a whole
			const legacyLocale = localStorage.getItem('locale');
			if (legacyLocale) {
				const parsed = JSON.parse(legacyLocale);
				messages = {
					...(parsed._bootErrors ?? {}),
					reload: parsed.reload,
				};
			}
		}
		if (!messages) messages = {};

		const title = messages?.title || 'Failed to initialize Misskey';
		const reload = messages?.reload || 'Reload';

		document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9v4" /><path d="M12 16v.01" /></svg>
		<div class="message">${title}</div>
		<div class="submessage">Error Code: ${code}</div>
		<button onclick="location.reload(!0)">
			<div>${reload}</div>
		</button>`;
		addStyle(`
		#misskey_app,
		#splash {
			display: none !important;
		}

		html,
		body {
			margin: 0;
		}

		body {
			position: relative;
			color: #dee7e4;
			font-family: Hiragino Maru Gothic Pro, BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
			line-height: 1.35;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			padding: 24px;
			box-sizing: border-box;
			overflow: hidden;

			border-radius: var(--radius, 12px);
			border: 1px solid rgba(231, 255, 251, 0.14);
		}

		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: #192320;
			border-radius: var(--radius, 12px);
			z-index: -1;
		}

		html.embed.norounded body,
		html.embed.norounded body::before {
			border-radius: 0;
		}

		html.embed.noborder body {
			border: none;
		}

		.icon {
			max-width: 60px;
			width: 100%;
			height: auto;
			margin-bottom: 20px;
			color: #dec340;
		}

		.message {
			text-align: center;
			font-size: 20px;
			font-weight: 700;
			margin-bottom: 20px;
		}

		.submessage {
			text-align: center;
			font-size: 90%;
			margin-bottom: 7.5px;
		}

		.submessage:last-of-type {
			margin-bottom: 20px;
		}

		button {
			padding: 7px 14px;
			min-width: 100px;
			font-weight: 700;
			font-family: Hiragino Maru Gothic Pro, BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
			line-height: 1.35;
			border-radius: 99rem;
			background-color: #b4e900;
			color: #192320;
			border: none;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}

		button:hover {
			background-color: #c6ff03;
		}`);
	}
})();
