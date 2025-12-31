/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getBgColor } from '@/utility/get-bg-color.js';

export const panelDirective = {
	mounted(src) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = getComputedStyle(window.document.documentElement).getPropertyValue('--MI_THEME-panel');

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = 'var(--MI_THEME-panel)';
		}
	},
} as Directive<HTMLElement>;
