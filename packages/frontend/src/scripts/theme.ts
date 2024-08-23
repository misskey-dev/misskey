/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import tinycolor from 'tinycolor2';
import { deepClone } from './clone.js';
import type { BundledTheme } from 'shiki/themes';
import { globalEvents } from '@/events.js';
import lightTheme from '@/themes/_light.json5';
import darkTheme from '@/themes/_dark.json5';
import { miLocalStorage } from '@/local-storage.js';
import lTypeLightEmerald from '@/themes/l-TypeLightEmerald.json5';
import lCoffee from '@/themes/l-coffee.json5';
import lApricot from '@/themes/l-apricot.json5';
import lRainy from '@/themes/l-rainy.json5';
import lBotanical from '@/themes/l-botanical.json5';
import lVivid from '@/themes/l-vivid.json5';
import lCherry from '@/themes/l-cherry.json5';
import lSushi from '@/themes/l-sushi.json5';
import lU0 from '@/themes/l-u0.json5';
import dDark from '@/themes/d-dark.json5';
import dPersimmon from '@/themes/d-persimmon.json5';
import dAstro from '@/themes/d-astro.json5';
import dFuture from '@/themes/d-future.json5';
import dBotanical from '@/themes/d-botanical.json5';
import dTypeDarkEmerald from '@/themes/d-TypeDarkEmerald.json5';
import dGreenOrange from '@/themes/d-green-orange.json5';
import dCherry from '@/themes/d-cherry.json5';
import dIce from '@/themes/d-ice.json5';
import dU0 from '@/themes/d-u0.json5';
export type Theme = {
	id: string;
	name: string;
	author: string;
	desc?: string;
	base?: 'dark' | 'light';
	props: Record<string, string>;
	codeHighlighter?: {
		base: BundledTheme;
		overrides?: Record<string, any>;
	} | {
		base: '_none_';
		overrides: Record<string, any>;
	};
};

export const themeProps = Object.keys(lightTheme.props).filter(key => !key.startsWith('X'));

export const getBuiltinThemes = () => Promise.resolve([
	lTypeLightEmerald,
	lCoffee,
	lApricot,
	lRainy,
	lBotanical,
	lVivid,
	lCherry,
	lSushi,
	lU0,
	dDark,
	dPersimmon,
	dAstro,
	dFuture,
	dBotanical,
	dTypeDarkEmerald,
	dGreenOrange,
	dCherry,
	dIce,
	dU0,
]);

export const getBuiltinThemesRef = () => {
	const builtinThemes = ref<Theme[]>([]);
	getBuiltinThemes().then(themes => builtinThemes.value = themes);
	return builtinThemes;
};

let timeout: number | null = null;

export function applyTheme(theme: Theme, persist = true) {
	if (timeout) window.clearTimeout(timeout);

	document.documentElement.classList.add('_themeChanging_');

	timeout = window.setTimeout(() => {
		document.documentElement.classList.remove('_themeChanging_');
	}, 1000);

	const colorScheme = theme.base === 'dark' ? 'dark' : 'light';

	// Deep copy
	const _theme = deepClone(theme);

	if (_theme.base) {
		const base = [lightTheme, darkTheme].find(x => x.id === _theme.base);
		if (base) _theme.props = Object.assign({}, base.props, _theme.props);
	}

	const props = compile(_theme);

	for (const tag of document.head.children) {
		if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
			tag.setAttribute('content', props['htmlThemeColor']);
			break;
		}
	}

	for (const [k, v] of Object.entries(props)) {
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	}

	document.documentElement.style.setProperty('color-scheme', colorScheme);

	if (persist) {
		miLocalStorage.setItem('theme', JSON.stringify(props));
		miLocalStorage.setItem('colorScheme', colorScheme);
	}

	// 色計算など再度行えるようにクライアント全体に通知
	globalEvents.emit('themeChanged');
}

function compile(theme: Theme): Record<string, string> {
	function getColor(val: string): tinycolor.Instance {
		if (val[0] === '@') { // ref (prop)
			return getColor(theme.props[val.substring(1)]);
		} else if (val[0] === '$') { // ref (const)
			return getColor(theme.props[val]);
		} else if (val[0] === ':') { // func
			const parts = val.split('<');
			const func = parts.shift().substring(1);
			const arg = parseFloat(parts.shift());
			const color = getColor(parts.join('<'));

			switch (func) {
				case 'darken': return color.darken(arg);
				case 'lighten': return color.lighten(arg);
				case 'alpha': return color.setAlpha(arg);
				case 'hue': return color.spin(arg);
				case 'saturate': return color.saturate(arg);
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
