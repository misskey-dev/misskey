/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import { compile, type Theme } from 'frontend-shared/js/theme';
import lightTheme from 'frontend-shared/themes/_light.json5';
import darkTheme from 'frontend-shared/themes/_dark.json5';
import { deepClone } from './clone.js';
import { globalEvents } from '@/events.js';
import { miLocalStorage } from '@/local-storage.js';

export const themeProps = Object.keys(lightTheme.props).filter(key => !key.startsWith('X'));

export const getBuiltinThemes = () => Promise.all([
	import('frontend-shared/themes/l-light.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-coffee.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-apricot.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-rainy.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-botanical.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-vivid.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-cherry.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-sushi.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/l-u0.json5').then(({ default: _default }): Theme => _default),

	import('frontend-shared/themes/d-dark.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-persimmon.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-astro.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-future.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-botanical.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-green-lime.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-green-orange.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-cherry.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-ice.json5').then(({ default: _default }): Theme => _default),
	import('frontend-shared/themes/d-u0.json5').then(({ default: _default }): Theme => _default),
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

	document.documentElement.dataset.colorScheme = colorScheme;

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
		document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());
	}

	document.documentElement.style.setProperty('color-scheme', colorScheme);

	if (persist) {
		miLocalStorage.setItem('theme', JSON.stringify(props));
		miLocalStorage.setItem('colorScheme', colorScheme);
	}

	// 色計算など再度行えるようにクライアント全体に通知
	globalEvents.emit('themeChanged');
}
