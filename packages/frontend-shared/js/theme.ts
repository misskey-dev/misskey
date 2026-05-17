/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import tinycolor from 'tinycolor2';
import JSON5 from 'json5';
import lightTheme from '@@/themes/_light.json5';
import type { BundledTheme } from 'shiki/themes';

export type Theme = {
	id: string;
	name: string;
	author: string;
	desc?: string;
	base?: 'dark' | 'light';
	kind?: 'dark' | 'light'; // legacy
	props: Record<string, string>;
	codeHighlighter?: {
		base: BundledTheme;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		overrides?: Record<string, any>;
	} | {
		base: '_none_';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		overrides: Record<string, any>;
	};
};

export type CompiledTheme = Record<string, string>;

export const themeProps = Object.keys(lightTheme.props).filter(key => !key.startsWith('X'));

export const getBuiltinThemes = () => Promise.all(
	[
		'l-light',
		'l-coffee',
		'l-apricot',
		'l-rainy',
		'l-botanical',
		'l-vivid',
		'l-cherry',
		'l-sushi',
		'l-u0',

		'd-dark',
		'd-persimmon',
		'd-astro',
		'd-future',
		'd-botanical',
		'd-green-lime',
		'd-green-orange',
		'd-cherry',
		'd-ice',
		'd-u0',
	].map(name => import(`@@/themes/${name}.json5`).then(({ default: _default }): Theme => _default)),
);

export function compile(theme: Theme): CompiledTheme {
	function getColor(val: string): tinycolor.Instance {
		if (val[0] === '@') { // ref (prop)
			return getColor(theme.props[val.substring(1)]);
		} else if (val[0] === '$') { // ref (const)
			return getColor(theme.props[val]);
		} else if (val[0] === ':') { // func
			const parts = val.split('<');
			const funcTxt = parts.shift();
			const argTxt = parts.shift();

			if (funcTxt && argTxt) {
				const func = funcTxt.substring(1);
				const arg = parseFloat(argTxt);
				const color = getColor(parts.join('<'));

				switch (func) {
					case 'darken': return color.darken(arg);
					case 'lighten': return color.lighten(arg);
					case 'alpha': return color.setAlpha(arg);
					case 'hue': return color.spin(arg);
					case 'saturate': return color.saturate(arg);
				}
			}
		}

		// other case
		return tinycolor(val);
	}

	const props = {} as CompiledTheme;

	for (const [k, v] of Object.entries(theme.props)) {
		if (k.startsWith('$')) continue; // ignore const

		props[k] = v.startsWith('"') ? v.replace(/^"\s*/, '') : genValue(getColor(v));
	}

	return props;
}

function genValue(c: tinycolor.Instance): string {
	return c.toRgbString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateTheme(theme: Record<string, any>): boolean {
	if (theme.id == null || typeof theme.id !== 'string') return false;
	if (theme.name == null || typeof theme.name !== 'string') return false;
	if (theme.base == null || !['light', 'dark'].includes(theme.base)) return false;
	if (theme.props == null || typeof theme.props !== 'object') return false;
	return true;
}

export function parseThemeCode(code: string): Theme {
	let theme;

	try {
		theme = JSON5.parse(code);
	} catch (_) {
		throw new Error('Failed to parse theme json');
	}
	if (!validateTheme(theme)) {
		throw new Error('This theme is invaild');
	}

	return theme;
}
