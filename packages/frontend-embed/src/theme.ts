/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: (可能な部分を)sharedに抽出して frontend と共通化

import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import { compile } from '@@/js/theme.js';
import type { Theme } from '@@/js/theme.js';

let timeout: number | null = null;

export function assertIsTheme(theme: Record<string, unknown>): theme is Theme {
	return typeof theme === 'object' && theme !== null && 'id' in theme && 'name' in theme && 'author' in theme && 'props' in theme;
}

export function applyTheme(theme: Theme) {
	if (timeout) window.clearTimeout(timeout);

	window.document.documentElement.classList.add('_themeChanging_');

	timeout = window.setTimeout(() => {
		window.document.documentElement.classList.remove('_themeChanging_');
	}, 1000);

	const colorScheme = theme.base === 'dark' ? 'dark' : 'light';

	window.document.documentElement.dataset.colorScheme = colorScheme;

	// Deep copy
	const _theme = JSON.parse(JSON.stringify(theme));

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

	// iframeを正常に透過させるために、cssのcolor-schemeは `light dark;` 固定にしてある。style.scss参照
}
