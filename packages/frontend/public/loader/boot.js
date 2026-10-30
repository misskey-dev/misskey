/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e.reason || e);
	};

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.');
		return;
	}

	//#region Detect language
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

	localStorage.setItem('lang', lang);
	//#endregion

	//#region Script
	async function importAppScript() {
		await import(CLIENT_ENTRY ? `/vite/${CLIENT_ENTRY.replace('scripts', lang)}` : '/vite/src/_boot_.ts')
			.catch(async e => {
				console.error(e);
				renderError('APP_IMPORT', e);
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
	//#endregion

	let isSafeMode = (localStorage.getItem('isSafeMode') === 'true');

	if (!isSafeMode) {
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.has('safemode') && urlParams.get('safemode') === 'true') {
			localStorage.setItem('isSafeMode', 'true');
			isSafeMode = true;
		}
	}

	//#region Theme
	if (!isSafeMode) {
		const theme = localStorage.getItem('theme');
		if (theme) {
			for (const [k, v] of Object.entries(JSON.parse(theme))) {
				document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());

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
	}

	const colorScheme = localStorage.getItem('colorScheme');
	if (colorScheme) {
		document.documentElement.style.setProperty('color-scheme', colorScheme);
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

	if (!isSafeMode) {
		const customCss = localStorage.getItem('customCss');
		if (customCss && customCss.length > 0) {
			const style = document.createElement('style');
			style.innerHTML = customCss;
			document.head.appendChild(style);
		}
	}

	async function addStyle(styleText) {
		let css = document.createElement('style');
		css.appendChild(document.createTextNode(styleText));
		document.head.appendChild(css);
	}

	async function renderError(code, details) {
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

		messages = Object.assign({
			title: 'Failed to initialize Misskey',
			solution: 'The following actions may solve the problem.',
			solution1: 'Update your os and browser',
			solution2: 'Disable an adblocker',
			solution3: 'Clear the browser cache',
			solution4: '(Tor Browser) Set dom.webaudio.enabled to true',
			otherOption: 'Other options',
			otherOption1: 'Clear preferences and cache',
			otherOption2: 'Start the simple client',
			otherOption3: 'Start the repair tool',
			otherOption4: 'Start Misskey in safe mode',
			reload: 'Reload',
		}, messages);

		const safeModeUrl = new URL(window.location.href);
		safeModeUrl.searchParams.set('safemode', 'true');

		let errorsElement = document.getElementById('errors');

		if (!errorsElement) {
			document.body.innerHTML = `
			<svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M12 9v2m0 4v.01"></path>
				<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
			</svg>
			<h1>${messages.title}</h1>
			<button class="button-big" onclick="location.reload(true);">
				<span class="button-label-big">${messages?.reload}</span>
			</button>
			<p><b>${messages.solution}</b></p>
			<p>${messages.solution1}</p>
			<p>${messages.solution2}</p>
			<p>${messages.solution3}</p>
			<p>${messages.solution4}</p>
			<details style="color: #86b300;">
				<summary>${messages.otherOption}</summary>
				<a href="${safeModeUrl}">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption4}</span>
					</button>
				</a>
				<br>
				<a href="/flush">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption1}</span>
					</button>
				</a>
				<br>
				<a href="/cli">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption2}</span>
					</button>
				</a>
				<br>
				<a href="/bios">
					<button class="button-small">
						<span class="button-label-small">${messages.otherOption3}</span>
					</button>
				</a>
			</details>
			<br>
			<div id="errors"></div>
			`;
			errorsElement = document.getElementById('errors');
		}
		const detailsElement = document.createElement('details');
		detailsElement.id = 'errorInfo';
		detailsElement.innerHTML = `
		<br>
		<summary>
			<code>ERROR CODE: ${code}</code>
		</summary>
		<code>${details.toString()} ${JSON.stringify(details)}</code>`;
		errorsElement.appendChild(detailsElement);
		addStyle(`
		* {
			font-family: BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
		}

		#misskey_app,
		#splash {
			display: none !important;
		}

		body,
		html {
			background-color: #222;
			color: #dfddcc;
			justify-content: center;
			margin: auto;
			padding: 10px;
			text-align: center;
		}

		button {
			border-radius: 999px;
			padding: 0px 12px 0px 12px;
			border: none;
			cursor: pointer;
			margin-bottom: 12px;
		}

		.button-big {
			background: linear-gradient(90deg, rgb(134, 179, 0), rgb(74, 179, 0));
			line-height: 50px;
		}

		.button-big:hover {
			background: rgb(153, 204, 0);
		}

		.button-small {
			background: #444;
			line-height: 40px;
		}

		.button-small:hover {
			background: #555;
		}

		.button-label-big {
			color: #222;
			font-weight: bold;
			font-size: 1.2em;
			padding: 12px;
		}

		.button-label-small {
			color: rgb(153, 204, 0);
			font-size: 16px;
			padding: 12px;
		}

		a {
			color: rgb(134, 179, 0);
			text-decoration: none;
		}

		p,
		li {
			font-size: 16px;
		}

		.icon-warning {
			color: #dec340;
			height: 4rem;
			padding-top: 2rem;
		}

		h1 {
			font-size: 1.5em;
			margin: 1em;
		}

		code {
			font-family: Fira, FiraCode, monospace;
		}

		#errorInfo {
			background: #333;
			margin-bottom: 2rem;
			padding: 0.5rem 1rem;
			width: 40rem;
			border-radius: 10px;
			justify-content: center;
			margin: auto;
		}

		#errorInfo summary {
			cursor: pointer;
		}

		#errorInfo summary > * {
			display: inline;
		}

		@media screen and (max-width: 500px) {
			#errorInfo {
				width: 50%;
			}
		}`);
	}
})();
