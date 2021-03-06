import * as tinycolor from 'tinycolor2';

export type Theme = {
	id: string;
	name: string;
	author: string;
	desc?: string;
	base?: 'dark' | 'light';
	props: Record<string, string>;
};

export const lightTheme: Theme = require('../themes/_light.json5');
export const darkTheme: Theme = require('../themes/_dark.json5');

export const themeProps = Object.keys(lightTheme.props).filter(key => !key.startsWith('X'));

export const builtinThemes = [
	require('../themes/l-light.json5'),
	require('../themes/l-apricot.json5'),

	require('../themes/d-dark.json5'),
	require('../themes/d-persimmon.json5'),
	require('../themes/d-black.json5'),
] as Theme[];

let timeout = null;

export function applyTheme(theme: Theme, persist = true) {
	if (timeout) clearTimeout(timeout);

	document.documentElement.classList.add('changing-theme');

	timeout = setTimeout(() => {
		document.documentElement.classList.remove('changing-theme');
	}, 1000);

	// Deep copy
	const _theme = JSON.parse(JSON.stringify(theme));

	if (_theme.base) {
		const base = [lightTheme, darkTheme].find(x => x.id === _theme.base);
		_theme.props = Object.assign({}, base.props, _theme.props);
	}

	const props = compile(_theme);

	for (const tag of document.head.children) {
		if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
			tag.setAttribute('content', props['html']);
			break;
		}
	}

	for (const [k, v] of Object.entries(props)) {
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	}

	if (persist) {
		localStorage.setItem('theme', JSON.stringify(props));
	}
}

function compile(theme: Theme): Record<string, string> {
	function getColor(val: string): tinycolor.Instance {
		// ref (prop)
		if (val[0] === '@') {
			return getColor(theme.props[val.substr(1)]);
		}

		// ref (const)
		else if (val[0] === '$') {
			return getColor(theme.props[val]);
		}

		// func
		else if (val[0] === ':') {
			const parts = val.split('<');
			const func = parts.shift().substr(1);
			const arg = parseFloat(parts.shift());
			const color = getColor(parts.join('<'));

			switch (func) {
				case 'darken': return color.darken(arg);
				case 'lighten': return color.lighten(arg);
				case 'alpha': return color.setAlpha(arg);
			}
		}

		// other case
		return tinycolor(val);
	}

	const props = {};

	for (const [k, v] of Object.entries(theme.props)) {
		if (k.startsWith('$')) continue; // ignore const

		props[k] = v.startsWith('"') ? v.replace(/^"\s*/, '') : genValue(getColor(v));
	}

	return props;
}

function genValue(c: tinycolor.Instance): string {
	return c.toRgbString();
}

export function validateTheme(theme: Record<string, any>): boolean {
	if (theme.id == null || typeof theme.id !== 'string') return false;
	if (theme.name == null || typeof theme.name !== 'string') return false;
	if (theme.base == null || !['light', 'dark'].includes(theme.base)) return false;
	if (theme.props == null || typeof theme.props !== 'object') return false;
	return true;
}
