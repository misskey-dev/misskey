import * as tinycolor from 'tinycolor2';

export type Theme = {
	id: string;
	name: string;
	author: string;
	desc?: string;
	base?: 'dark' | 'light';
	vars: { [key: string]: string };
	props: { [key: string]: string };
};

export const lightTheme: Theme = require('../theme/light.json5');
export const darkTheme: Theme = require('../theme/dark.json5');
export const pinkTheme: Theme = require('../theme/pink.json5');
export const blackTheme: Theme = require('../theme/black.json5');
export const halloweenTheme: Theme = require('../theme/halloween.json5');
export const cafeTheme: Theme = require('../theme/cafe.json5');
export const japaneseSushiSetTheme: Theme = require('../theme/japanese-sushi-set.json5');
export const gruvboxDarkTheme: Theme = require('../theme/gruvbox-dark.json5');
export const monokaiTheme: Theme = require('../theme/monokai.json5');
export const colorfulTheme: Theme = require('../theme/colorful.json5');
export const rainyTheme: Theme = require('../theme/rainy.json5');
export const mauveTheme: Theme = require('../theme/mauve.json5');
export const grayTheme: Theme = require('../theme/gray.json5');
export const tweetDeckTheme: Theme = require('../theme/tweet-deck.json5');

export const builtinThemes = [
	lightTheme,
	darkTheme,
	pinkTheme,
	blackTheme,
	halloweenTheme,
	cafeTheme,
	japaneseSushiSetTheme,
	gruvboxDarkTheme,
	monokaiTheme,
	colorfulTheme,
	rainyTheme,
	mauveTheme,
	grayTheme,
	tweetDeckTheme,
];

export function applyTheme(theme: Theme, persisted = true) {
	document.documentElement.classList.add('changing-theme');

	setTimeout(() => {
		document.documentElement.classList.remove('changing-theme');
	}, 1000);

	// Deep copy
	const _theme = JSON.parse(JSON.stringify(theme));

	if (_theme.base) {
		const base = [lightTheme, darkTheme].find(x => x.id == _theme.base);
		_theme.vars = Object.assign({}, base.vars, _theme.vars);
		_theme.props = Object.assign({}, base.props, _theme.props);
	}

	const props = compile(_theme);

	for (const [k, v] of Object.entries(props)) {
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	}

	if (persisted) {
		localStorage.setItem('theme', JSON.stringify(props));
	}
}

function compile(theme: Theme): { [key: string]: string } {
	function getColor(code: string): tinycolor.Instance {
		// ref
		if (code[0] == '@') {
			return getColor(theme.props[code.substr(1)]);
		}
		if (code[0] == '$') {
			return getColor(theme.vars[code.substr(1)]);
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

	for (const [k, v] of Object.entries(theme.props)) {
		props[k] = genValue(getColor(v));
	}

	const primary = getColor(props['primary']);

	for (let i = 1; i < 10; i++) {
		const color = primary.clone().setAlpha(i / 10);
		props['primaryAlpha0' + i] = genValue(color);
	}

	for (let i = 5; i < 100; i += 5) {
		const color = primary.clone().lighten(i);
		props['primaryLighten' + i] = genValue(color);
	}

	for (let i = 5; i < 100; i += 5) {
		const color = primary.clone().darken(i);
		props['primaryDarken' + i] = genValue(color);
	}

	return props;
}

function genValue(c: tinycolor.Instance): string {
	return c.toRgbString();
}
