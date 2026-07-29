/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { themeManager } from '@/theme.js';
import { getBgColor } from '@/utility/get-bg-color.js';

export const panelDirective = {
	mounted(src) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = themeManager.currentCompiledTheme!.panel;

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = 'var(--MI_THEME-panel)';
		}
	},
} as Directive<HTMLElement>;
