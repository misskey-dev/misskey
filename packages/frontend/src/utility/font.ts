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
	'kosugi-maru': {
		name: 'Kosugi Maru',
		fontFamily: 'Kosugi Maru',
		importUrl: 'https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap',
	},
	'hachi-maru-pop': {
		name: 'Hachi Maru Pop',
		fontFamily: 'Hachi Maru Pop',
		importUrl: 'https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap',
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
};

export function applyFont(fontname: null | string) {
	let style = document.getElementById('custom-font');

	if (!fontname) {
		if (!style) return;
		return style.remove();
	}

	if (!style) {
		style = document.createElement('style');
		style.id = 'custom-font';
		document.head.appendChild(style);
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
	applyFont(prefer.s.customFont);
}
