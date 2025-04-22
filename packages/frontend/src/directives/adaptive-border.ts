/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getBgColor } from '@/utility/get-bg-color.js';
import { globalEvents } from '@/events.js';

const handlerMap = new WeakMap<any, any>();

export default {
	mounted(src, binding, vn) {
		function calc() {
			const parentBg = getBgColor(src.parentElement) ?? 'transparent';

			const myBg = window.getComputedStyle(src).backgroundColor;

			if (parentBg === myBg) {
				src.style.borderColor = 'var(--MI_THEME-divider)';
			} else {
				src.style.borderColor = myBg;
			}
		}

		handlerMap.set(src, calc);

		calc();

		globalEvents.on('themeChanged', calc);
	},

	unmounted(src, binding, vn) {
		globalEvents.off('themeChanged', handlerMap.get(src));
	},
} as Directive;
