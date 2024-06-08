/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Directive } from 'vue';

export default {
	mounted(src, binding, vn) {
		const getBgColor = (el: HTMLElement) => {
			const style = window.getComputedStyle(el);
			if (style.backgroundColor && !['rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)', 'transparent'].includes(style.backgroundColor)) {
				return style.backgroundColor;
			} else {
				return el.parentElement ? getBgColor(el.parentElement) : 'transparent';
			}
		};

		const parentBg = getBgColor(src.parentElement);

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.borderColor = 'var(--divider)';
		} else {
			src.style.borderColor = myBg;
		}
	},
} as Directive;
