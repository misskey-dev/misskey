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

export const lightTheme: Theme = require('../themes/light.json5');
export const darkTheme: Theme = require('../themes/dark.json5');
export const lavenderTheme: Theme = require('../themes/lavender.json5');
export const futureTheme: Theme = require('../themes/future.json5');
export const halloweenTheme: Theme = require('../themes/halloween.json5');
export const cafeTheme: Theme = require('../themes/cafe.json5');
export const japaneseSushiSetTheme: Theme = require('../themes/japanese-sushi-set.json5');
export const gruvboxDarkTheme: Theme = require('../themes/gruvbox-dark.json5');
export const monokaiTheme: Theme = require('../themes/monokai.json5');
export const colorfulTheme: Theme = require('../themes/colorful.json5');
export const rainyTheme: Theme = require('../themes/rainy.json5');
export const mauveTheme: Theme = require('../themes/mauve.json5');
export const grayTheme: Theme = require('../themes/gray.json5');
export const tweetDeckTheme: Theme = require('../themes/tweet-deck.json5');

export const builtinThemes = [
	lightTheme,
	darkTheme,
	lavenderTheme,
	futureTheme,
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

export function applyTheme(themes: Theme, persisted = true) {
	document.documentElement.classList.add('changing-themes');

	setTimeout(() => {
		document.documentElement.classList.remove('changing-themes');
	}, 1000);

	// Deep copy
	const _themes = JSON.parse(JSON.stringify(themes));

	if (_themes.base) {
		const base = [lightTheme, darkTheme].find(x => x.id == _themes.base);
		_themes.vars = Object.assign({}, base.vars, _themes.vars);
		_themes.props = Object.assign({}, base.props, _themes.props);
	}

	const props = compile(_themes);

	for (const [k, v] of Object.entries(props)) {
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	}

	if (persisted) {
		localStorage.setItem('themes', JSON.stringify(props));
	}
}

function compile(themes: Theme): { [key: string]: string } {
	function getColor(code: string): tinycolor.Instance {
		// ref
		if (code[0] == '@') {
			return getColor(themes.props[code.substr(1)]);
		}
		if (code[0] == '$') {
			return getColor(themes.vars[code.substr(1)]);
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

	for (const [k, v] of Object.entries(themes.props)) {
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
