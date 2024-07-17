/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * BOOT LOADER
 * サーバーからレスポンスされるHTMLに埋め込まれるスクリプトで、以下の役割を持ちます。
 * - 翻訳ファイルをフェッチする。
 * - 事前に挿入されたCLIENT_ENTRYを読んで適切なメインスクリプトを読み込む。
 * - キャッシュされたコンパイル済みテーマを適用する。
 * - クライアントの設定値に基づいて対応するHTMLクラス等を設定する。
 * - もしメインスクリプトの読み込みなどでエラーが発生した場合は、renderErrorでエラーを描画する。
 * テーマをこの段階で設定するのは、メインスクリプトが読み込まれる間もテーマを適用したいためです。
 */

'use strict';

var misskey_loader = new Set();

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
function boot() {
	const defaultSolutions = [
		'Reload / リロードする',
		'Clear the browser cache then reload / ブラウザのキャッシュをクリアしてリロードする',
		'Update your os and browser / ブラウザおよびOSを最新バージョンに更新する',
		'Disable an adblocker / アドブロッカーを無効にする',
		'&#40;Tor Browser&#41; Set dom.webaudio.enabled to true / dom.webaudio.enabledをtrueに設定する'
	];

	const onErrorStyle = `
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

	summary {
		cursor: pointer;
	}

	code {
		font-family: Fira, FiraCode, monospace;
	}

	#errors {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.errorInfo {
		background: #333;
		width: 40rem;
		max-width: 100%;
		border-radius: 10px;
		justify-content: center;
		padding: 1rem;
		margin-bottom: 1rem;
		box-sizing: border-box;
	}

	.errorInfo > pre {
		text-wrap: auto;
		text-wrap: balance;
	}
	`;


	const addStyle = (styleText) => {
		try {
			let css = document.createElement('style');
			css.appendChild(document.createTextNode(styleText));
			document.head.appendChild(css);
		} catch (e) {
			console.error(e);
		}
	}

	const renderError = (code, details, solutions = defaultSolutions) => {
		if (document.readyState === 'loading') {
			window.addEventListener('DOMContentLoaded', () => {
				renderError(code, details, solutions);
			});
			try {
				addStyle(onErrorStyle);
			} catch (e) { }
			return;
		}

		let errorsElement = document.getElementById('errors');

		if (!errorsElement) {
			// エラー描画用のビューになっていない場合は、エラー描画用のビューに切り替える
			document.body.innerHTML = `
			<svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-alert-triangle" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M12 9v2m0 4v.01"></path>
				<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
			</svg>
			<h1>Failed to load<br>読み込みに失敗しました</h1>
			<button class="button-big" onclick="location.reload(true);">
				<span class="button-label-big">Reload / リロード</span>
			</button>
			<p><b>The following actions may solve the problem. / 以下を行うと解決する可能性があります。</b></p>
			${solutions.map(x => `<p>${x}</p>`).join('')}
			<details style="color: #86b300;">
				<summary>Other options / その他のオプション</summary>
				<a href="/flush">
					<button class="button-small">
						<span class="button-label-small">Clear preferences and cache</span>
					</button>
				</a>
				<br>
				<a href="/cli">
					<button class="button-small">
						<span class="button-label-small">Start the simple client</span>
					</button>
				</a>
				<br>
				<a href="/bios">
					<button class="button-small">
						<span class="button-label-small">Start the repair tool</span>
					</button>
				</a>
			</details>
			<br>
			<div id="errors"></div>
			`;
			errorsElement = document.getElementById('errors');
		}

		if (typeof details === 'string') {
			const errorEl = document.createElement('div');
			errorEl.classList.add('errorInfo');

			const titleCodeElement = document.createElement('code');
			titleCodeElement.textContent = `ERROR CODE: ${code}`;
			errorEl.appendChild(titleCodeElement);

			errorEl.appendChild(document.createElement('br'));

			const detailsCodeElement = document.createElement('code');
			detailsCodeElement.textContent = details;
			errorEl.appendChild(detailsCodeElement);

			errorsElement.appendChild(errorEl);
		} else if (details instanceof Error) {
			const errorEl = document.createElement('details');
			errorEl.classList.add('errorInfo');

			const summaryElement = document.createElement('summary');
			const titleCodeElement = document.createElement('code');
			titleCodeElement.textContent = `ERROR CODE: ${code} (${details.name})`;
			summaryElement.appendChild(titleCodeElement);
			errorEl.appendChild(summaryElement);

			const detailsPreElement = document.createElement('pre');
			const detailsMessageElement = document.createElement('code');
			detailsMessageElement.textContent = details.message;
			detailsPreElement.appendChild(detailsMessageElement);
			detailsPreElement.appendChild(document.createElement('br'));
			const detailsCodeElement = document.createElement('code');
			detailsCodeElement.textContent = details.stack;
			detailsPreElement.appendChild(detailsCodeElement);
			errorEl.appendChild(detailsPreElement);

			errorsElement.appendChild(errorEl);
		} else {
			const errorEl = document.createElement('details');
			errorEl.classList.add('errorInfo');

			const summaryElement = document.createElement('summary');
			const titleCodeElement = document.createElement('code');
			titleCodeElement.textContent = `ERROR CODE: ${code}`;
			summaryElement.appendChild(titleCodeElement);
			errorEl.appendChild(summaryElement);

			const detailsCodeElement = document.createElement('code');
			detailsCodeElement.textContent = JSON.stringify(details);
			errorEl.appendChild(detailsCodeElement);

			errorsElement.appendChild(errorEl);
		}

		addStyle(onErrorStyle);
	}

	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e);
	};

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.')
		renderError('FORCED_ERROR', Error('This error is forced by having forceError in local storage.'));
		return;
	}

	//#region After DOM loaded
	async function oncontentload() {
		const providedMetaEl = document.getElementById('misskey_meta');
		const meta = providedMetaEl && providedMetaEl.textContent ? JSON.parse(providedMetaEl.textContent) : null;
		const providedAt = providedMetaEl && providedMetaEl.dataset.generatedAt ? parseInt(providedMetaEl.dataset.generatedAt) : 0;
		console.log('providedAt', providedAt, 'now', Date.now());
		if (providedAt < Date.now() - 1000 * 60 * 60 * 24) {
			// 古いデータがなぜか提供された場合は、エラーを描画する
			renderError(
				'META_PROVIDED_AT_TOO_OLD',
				'This view is too old. Please reload. (It is also possible that the reverse proxy is unable to connect to the server and is serving the outdated view.)',
				[
					'Reload / リロードする',
					'Clear the browser cache then reload / ブラウザのキャッシュをクリアしてリロードする',
					'Update your os and browser / ブラウザおよびOSを最新バージョンに更新する',
					'Disable an adblocker / アドブロッカーを無効にする',
				],
			);
			return;
		}

		//#region Detect language & fetch translations on first load
		if (!localStorage.hasOwnProperty('locale')) {
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

			const v = meta?.version;

			// for https://github.com/misskey-dev/misskey/issues/10202
			if (lang == null || lang.toString == null || lang.toString() === 'null') {
				console.warn('invalid lang value detected!!!', typeof lang, lang);
				lang = 'en-US';
			}

			const localRes = await window.fetch(`/assets/locales/${lang}.${v}.json`);
			if (localRes.status === 200) {
				localStorage.setItem('lang', lang);
				localStorage.setItem('locale', await localRes.text());
				localStorage.setItem('localeVersion', v);
			} else {
				renderError('LOCALE_FETCH');
				return;
			}
		}
		//#endregion

		await import(`/vite/${CLIENT_ENTRY}`)
			.catch(async e => {
				console.error(e);
				renderError('APP_IMPORT', e);
			});
	}

	if (document.readyState !== 'loading') {
		misskey_loader.add(oncontentload());
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			misskey_loader.add(oncontentload());
		});
	}
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
}

boot();
