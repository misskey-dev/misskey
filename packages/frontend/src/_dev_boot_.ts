/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// devモードで起動される際（index.htmlを使うとき）はrouterが暴発してしまってうまく読み込めない。
// よって、devモードとして起動されるときはビルド時に組み込む形としておく。
// (pnpm start時はpugファイルの中で静的リソースとして読み込むようになっており、この問題は起こっていない)
import '@tabler/icons-webfont/dist/tabler-icons.scss';

await main();

import('@/_boot_.js');

/**
 * backend/src/server/web/boot.jsで差し込まれている起動処理のうち、最低限必要なものを模倣するための処理
 */
async function main() {
	const forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.');
	}

	//#region Detect language & fetch translations

	// dev-modeの場合は常に取り直す
	const supportedLangs = _LANGS_.map(it => it[0]);
	let lang: string | null | undefined = localStorage.getItem('lang');
	if (lang == null || !supportedLangs.includes(lang)) {
		if (supportedLangs.includes(navigator.language)) {
			lang = navigator.language;
		} else {
			lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

			// Fallback
			if (lang == null) lang = 'en-US';
		}
	}

	// TODO:今のままだと言語ファイル変更後はpnpm devをリスタートする必要があるので、chokidarを使ったり等で対応できるようにする
	const locale = _LANGS_FULL_.find(it => it[0] === lang);
	localStorage.setItem('lang', lang);
	localStorage.setItem('locale', JSON.stringify(locale[1]));
	localStorage.setItem('localeVersion', _VERSION_);
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

function renderError(code: string, details?: string) {
	console.log(code, details);
}
