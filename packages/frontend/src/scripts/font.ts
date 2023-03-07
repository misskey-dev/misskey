export const fontList = {
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
	'biz-udpgothic': {
		name: 'BIZ UDP Gothic',
		fontFamily: 'BIZ UDPGothic',
		importUrl: 'https://fonts.googleapis.com/css2?family=BIZ+UDPGothic&display=swap',
	},
	'biz-udmincho': {
		name: 'BIZ UD Mincho',
		fontFamily: 'BIZ UDMincho',
		importUrl: 'https://fonts.googleapis.com/css2?family=BIZ+UDMincho&display=swap',
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
	'dot-gothic16': {
		name: 'Dot Gothic 16',
		fontFamily: 'DotGothic16',
		importUrl: 'https://fonts.googleapis.com/css2?family=DotGothic16&display=swap',
	},
};

export function applyFont(fontname: null | string) {
	console.log('called');
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

	style.innerHTML = `
		@import url('${font.importUrl}');
		body {
			font-family: '${font.fontFamily}', 'Hiragino Maru Gothic Pro', 'BIZ UDGothic', Roboto, HelveticaNeue, Arial, sans-serif;
		}
	`;
}
