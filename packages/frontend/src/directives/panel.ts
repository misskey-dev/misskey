/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { themeManager } from '@/theme.js';
import { getBgColor } from '@/utility/get-bg-color.js';

function applyPanelStyle(src: HTMLElement, enabled: boolean | undefined) {
	if (enabled === false) {
		src.style.backgroundColor = '';
		return;
	}

	const parentBg = getBgColor(src.parentElement) ?? 'transparent';

	const myBg = themeManager.currentCompiledTheme!.panel;

	if (parentBg === myBg) {
		src.style.backgroundColor = 'var(--MI_THEME-bg)';
	} else {
		src.style.backgroundColor = 'var(--MI_THEME-panel)';
	}
}

export const panelDirective = {
	mounted(src, binding) {
		applyPanelStyle(src, binding.value);
	},
	updated(src, binding) {
		if (binding.value === binding.oldValue) return;
		applyPanelStyle(src, binding.value);
	},
} as Directive<HTMLElement, boolean | undefined>;
