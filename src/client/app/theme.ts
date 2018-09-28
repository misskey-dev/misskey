import * as tinycolor from 'tinycolor2';

type Theme = {
	meta: {
		id: string;
		name: string;
		author: string;
		base?: string;
		vars: any;
	};
} & {
	[key: string]: string;
};

export function applyTheme(theme: Theme, persisted = true) {
	if (theme.meta.base) {
		const base = [lightTheme, darkTheme].find(x => x.meta.id == theme.meta.base);
		theme = Object.assign({}, base, theme);
	}

	const props = compile(theme);

	Object.entries(props).forEach(([k, v]) => {
		if (k == 'meta') return;
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	});

	if (persisted) {
		localStorage.setItem('theme', JSON.stringify(props));
	}
}

function compile(theme: Theme): { [key: string]: string } {
	function getColor(code: string): tinycolor.Instance {
		// ref
		if (code[0] == '@') {
			return getColor(theme[code.substr(1)]);
		}
		if (code[0] == '$') {
			return getColor(theme.meta.vars[code.substr(1)]);
		}

		// func
		if (code[0] == ':') {
			const parts = code.split('<');
			const func = parts.shift().substr(1);
			const arg = parseFloat(parts.shift());
			const color = getColor(parts.join('<'));

			switch (func) {
				case 'darken': return color.darken(arg);
				case 'lighten': return color.lighten(arg);
				case 'alpha': return color.setAlpha(arg);
			}
		}

		return tinycolor(code);
	}

	const props = {};

	Object.entries(theme).forEach(([k, v]) => {
		if (k == 'meta') return;
		const c = getColor(v);
		props[k] = genValue(c);
	});

	const primary = getColor(props['primary']);

	for (let i = 1; i < 10; i++) {
		const color = primary.clone().setAlpha(i / 10);
		props['primaryAlpha0' + i] = genValue(color);
	}

	for (let i = 1; i < 100; i++) {
		const color = primary.clone().lighten(i);
		props['primaryLighten' + i] = genValue(color);
	}

	for (let i = 1; i < 100; i++) {
		const color = primary.clone().darken(i);
		props['primaryDarken' + i] = genValue(color);
	}

	return props;
}

function genValue(c: tinycolor.Instance): string {
	return c.toRgbString();
}

export const lightTheme = require('../theme/light.json');
export const darkTheme = require('../theme/dark.json');
export const halloweenTheme = require('../theme/halloween.json');

export const builtinThemes = [
	lightTheme,
	darkTheme,
	halloweenTheme
];
