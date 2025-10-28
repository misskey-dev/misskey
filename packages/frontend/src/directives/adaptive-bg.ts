/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getBgColor } from '@/utility/get-bg-color.js';

export const adaptiveBgDirective = {
	mounted(src) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = myBg;
		}
	},
} as Directive<HTMLElement>;
