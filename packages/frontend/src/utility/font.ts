/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { prefer } from '@/preferences.js';

export const fontList = {
	'browser-default': {
		name: 'ブラウザ標準',
		fontFamily: 'system-ui',
		importUrl: null,
	},
	'noto-sans': {
		name: 'Noto Sans',
		fontFamily: 'Noto Sans JP',
		importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap',
	},
	'noto-serif': {
		name: 'Noto Serif JP',
		fontFamily: 'Noto Serif JP',
		importUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP&display=swap',
	},
	'sawarabi-gothic': {
		name: 'Sawarabi Gothic',
		fontFamily: 'Sawarabi Gothic',
		importUrl: 'https://fonts.googleapis.com/css2?family=Sawarabi+Gothic&display=swap',
	},
	'sawarabi-mincho': {
		name: 'Sawarabi Mincho',
		fontFamily: 'Sawarabi Mincho',
		importUrl: 'https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&display=swap',
	},
	'm-plus': {
		name: 'M PLUS',
		fontFamily: 'M PLUS 1p',
		importUrl: 'https://fonts.googleapis.com/css2?family=M+PLUS+1p&display=swap',
	},
	'm-plus-rounded': {
		name: 'M PLUS Rounded',
		fontFamily: 'M PLUS Rounded 1c',
		importUrl: 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap',
	},
	'm-plus-2': {
		name: 'M PLUS 2',
		fontFamily: 'M PLUS 2',
		importUrl: 'https://fonts.googleapis.com/css2?family=M+PLUS+2&display=swap',
	},
	'murecho': {
		name: 'Murecho',
		fontFamily: 'Murecho',
		importUrl: 'https://fonts.googleapis.com/css2?family=Murecho&display=swap',
	},
	'rocknroll-one': {
		name: 'RocknRoll One',
		fontFamily: 'RocknRoll One',
		importUrl: 'https://fonts.googleapis.com/css2?family=RocknRoll+One&display=swap',
	},
	'klee-one': {
		name: 'Klee One',
		fontFamily: 'Klee One',
		importUrl: 'https://fonts.googleapis.com/css2?family=Klee+One&display=swap',
	},
	'zen-maru-gothic': {
		name: 'Zen Maru Gothic',
		fontFamily: 'Zen Maru Gothic',
		importUrl: 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic&display=swap',
	},
	'kaisei-decol': {
		name: 'Kaisei Decol',
		fontFamily: 'Kaisei Decol',
		importUrl: 'https://fonts.googleapis.com/css2?family=Kaisei+Decol&display=swap',
	},
	'yomogi': {
		name: 'Yomogi',
		fontFamily: 'Yomogi',
		importUrl: 'https://fonts.googleapis.com/css2?family=Yomogi&display=swap',
	},
	'kosugi': {
		name: 'Kosugi',
		fontFamily: 'Kosugi',
		importUrl: 'https://fonts.googleapis.com/css2?family=Kosugi&display=swap',
	},
	'kosugi-maru': {
		name: 'Kosugi Maru',
		fontFamily: 'Kosugi Maru',
		importUrl: 'https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap',
	},
	'kiwi-maru': {
		name: 'Kiwi Maru',
		fontFamily: 'Kiwi Maru',
		importUrl: 'https://fonts.googleapis.com/css2?family=Kiwi+Maru:wght@300&display=swap',
	},
	'hachi-maru-pop': {
		name: 'Hachi Maru Pop',
		fontFamily: 'Hachi Maru Pop',
		importUrl: 'https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap',
	},
	'mochiy-pop-one': {
		name: 'Mochiy Pop One',
		fontFamily: 'Mochiy Pop One',
		importUrl: 'https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap',
	},
	'mochiy-pop-p-one': {
		name: 'Mochiy Pop P One',
		fontFamily: 'Mochiy Pop P One',
		importUrl: 'https://fonts.googleapis.com/css2?family=Mochiy+Pop+P+One&display=swap',
	},
	'yusei-magic': {
		name: 'Yusei Magic',
		fontFamily: 'Yusei Magic',
		importUrl: 'https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap',
	},
	'dot-gothic16': {
		name: 'Dot Gothic 16',
		fontFamily: 'DotGothic16',
		importUrl: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',
	},
	'tegaki-zatsu': {
		name: '手書き雑フォント',
		fontFamily: '手書き雑フォント',
		importUrl: null,
		customCss: `@font-face {
            font-family: '手書き雑フォント';
            src: url('https://cdn.leafscape.be/tegaki_zatsu/851tegaki_zatsu_web.woff2') format("woff2");
            font-display: swap;
        }`,
	},
	'seto-font': {
		name: '瀬戸フォント',
		fontFamily: '瀬戸フォント',
		importUrl: null,
		customCss: `@font-face {
            font-family: '瀬戸フォント';
            src: url('https://cdn.leafscape.be/setofont/setofont_web.woff2') format("woff2");
            font-display: swap;
        }`,
	},
};

export function applyFont(fontname: null | keyof typeof fontList) {
	let style = window.document.getElementById('custom-font');

	if (!fontname) {
		if (!style) return;
		return style.remove();
	}

	if (!style) {
		style = window.document.createElement('style');
		style.id = 'custom-font';
		window.document.head.appendChild(style);
	}

	const font = fontList[fontname];
	if (!font) return;

	// ブラウザ標準フォントの場合
	if (fontname === 'browser-default') {
		style.innerHTML = `
            body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }
        `;
		return;
	}

	// カスタムCSSが定義されている場合（@font-face など）
	if ('customCss' in font && font.customCss) {
		style.innerHTML = `
            ${font.customCss}
            body {
                font-family: '${font.fontFamily}', 'Hiragino Maru Gothic Pro', 'BIZ UDGothic', Roboto, HelveticaNeue, Arial, sans-serif;
            }
        `;
		return;
	}

	// Webフォントの場合（既存コード）
	style.innerHTML = `
        @import url('${font.importUrl}');
        body {
            font-family: '${font.fontFamily}', 'Hiragino Maru Gothic Pro', 'BIZ UDGothic', Roboto, HelveticaNeue, Arial, sans-serif;
        }
    `;
}

// Self-initialization code - this runs when the module is imported
if (prefer.s.customFont) {
	applyFont(prefer.s.customFont as keyof typeof fontList);
}
