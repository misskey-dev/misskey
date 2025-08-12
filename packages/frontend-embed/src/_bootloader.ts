/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

import { addStyle, bootloaderLocales, detectLanguage } from '@@/js/bootloader';

interface Window {
	CLIENT_ENTRY: string | undefined;
}

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (error) => {
		console.error(error);
		renderError('SOMETHING_HAPPENED');
	};
	window.onunhandledrejection = (error) => {
		console.error(error);
		renderError('SOMETHING_HAPPENED_IN_PROMISE');
	};

	const forceError = localStorage.getItem('forceError');
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

	const lang = detectLanguage();

	//#region Script
	async function importAppScript() {
		await import(`/embed_vite/${(window.CLIENT_ENTRY ?? 'src/boot.ts').replace('scripts', lang)}`)
			.catch(async error => {
				console.error(error);
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
	//#endregion

	async function renderError(code: string, _details?) {
		// Cannot set property 'innerHTML' of null を回避
		if (document.readyState === 'loading') {
			await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
		}

		const messages = bootloaderLocales();

		document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 9v4" /><path d="M12 16v.01" /></svg>
		<div class="message">${messages.title}</div>
		<div class="submessage">Error Code: ${code}</div>
		<button onclick="location.reload(!0)">
			<div>${messages.reload}</div>
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
