/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: (可能な部分を)sharedに抽出して frontend-embed と共通化

import { ref, nextTick } from 'vue';
import tinycolor from 'tinycolor2';
import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import JSON5 from 'json5';
import { version } from '@@/js/config.js';
import type { Ref } from 'vue';
import type { BundledTheme } from 'shiki/themes';
import { deepClone } from '@/utility/clone.js';
import { globalEvents } from '@/events.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/i.js';
import { prefer } from '@/preferences.js';
import { deepEqual } from '@/utility/deep-equal.js';

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
		overrides?: Record<string, any>;
	} | {
		base: '_none_';
		overrides: Record<string, any>;
	};
};

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

export function getBuiltinThemesRef() {
	const builtinThemes = ref<Theme[]>([]);
	getBuiltinThemes().then(themes => builtinThemes.value = themes);
	return builtinThemes;
}

export function getThemesRef(): Ref<Theme[]> {
	return prefer.r.themes;
}

export async function addTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const builtinThemes = await getBuiltinThemes();
	if (builtinThemes.some(t => t.id === theme.id)) {
		throw new Error('builtin theme');
	}
	const themes = prefer.s.themes;
	if (themes.some(t => t.id === theme.id)) {
		throw new Error('already exists');
	}
	prefer.commit('themes', [...themes, theme]);
}

export async function removeTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const themes = prefer.s.themes.filter(t => t.id !== theme.id);
	prefer.commit('themes', themes);
}

function applyThemeInternal(theme: Theme, persist: boolean) {
	const colorScheme = theme.base === 'dark' ? 'dark' : 'light';

	window.document.documentElement.dataset.colorScheme = colorScheme;

	// Deep copy
	const _theme = deepClone(theme);

	if (_theme.base) {
		const base = [lightTheme, darkTheme].find(x => x.id === _theme.base);
		if (base) _theme.props = Object.assign({}, base.props, _theme.props);
	}

	const props = compile(_theme);

	for (const tag of window.document.head.children) {
		if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
			tag.setAttribute('content', props['htmlThemeColor']);
			break;
		}
	}

	for (const [k, v] of Object.entries(props)) {
		window.document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());
	}

	window.document.documentElement.style.setProperty('color-scheme', colorScheme);

	if (persist) {
		miLocalStorage.setItem('theme', JSON.stringify(props));
		miLocalStorage.setItem('themeId', theme.id);
		miLocalStorage.setItem('themeCachedVersion', version);
		miLocalStorage.setItem('colorScheme', colorScheme);
	}

	// 色計算など再度行えるようにクライアント全体に通知
	globalEvents.emit('themeChanging');
}

let timeout: number | null = null;
let currentThemeId = miLocalStorage.getItem('themeId');

export function applyTheme(theme: Theme, persist = true) {
	if (timeout) {
		window.clearTimeout(timeout);
		timeout = null;
	}

	if (theme.id === currentThemeId && miLocalStorage.getItem('themeCachedVersion') === version) return;
	currentThemeId = theme.id;

	// visibilityStateがhiddenな状態でstartViewTransitionするとブラウザによってはエラーになる
	// 通常hiddenな時に呼ばれることはないが、iOSのPWAだとアプリ切り替え時に(何故か)hiddenな状態で(何故か)一瞬デバイスのダークモード判定が変わりapplyThemeが呼ばれる場合がある
	if (window.document.startViewTransition != null && window.document.visibilityState === 'visible') {
		window.document.documentElement.classList.add('_themeChanging_');
		try {
			window.document.startViewTransition(async () => {
				applyThemeInternal(theme, persist);
				await nextTick();
			}).finished.then(() => {
				window.document.documentElement.classList.remove('_themeChanging_');
				globalEvents.emit('themeChanged');
			});
		} catch (err) {
			// 様々な理由により startViewTransition は失敗することがある
			// ref. https://github.com/misskey-dev/misskey/issues/16562

			// FIXME: viewTransitonエラーはtry~catch貫通してそうな気配がする

			console.error(err);

			window.document.documentElement.classList.remove('_themeChanging_');
			applyThemeInternal(theme, persist);
			globalEvents.emit('themeChanged');
		}
	} else {
		applyThemeInternal(theme, persist);
		globalEvents.emit('themeChanged');
	}
}

export function compile(theme: Theme): Record<string, string> {
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

	const props = {} as Record<string, string>;

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
	if (prefer.s.themes.some(t => t.id === theme.id)) {
		throw new Error('This theme is already installed');
	}

	return theme;
}

export function previewTheme(code: string): void {
	const theme = parseThemeCode(code);
	if (theme != null) applyTheme(theme, false);
}

export async function installTheme(code: string): Promise<void> {
	const theme = parseThemeCode(code);
	if (theme == null) return;
	await addTheme(theme);
}

export function clearAppliedThemeCache() {
	miLocalStorage.removeItem('theme');
	miLocalStorage.removeItem('themeId');
	miLocalStorage.removeItem('themeCachedVersion');
}
