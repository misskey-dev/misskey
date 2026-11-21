/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';

export const animDirective = {
	mounted(src) {
		// 終了値は指定せず、要素本来のスタイルに向かってアニメーションさせる
		src.animate([{
			offset: 0,
			opacity: 0,
			transform: 'scale(0.9)',
		}], {
			duration: 500,
			easing: 'cubic-bezier(0,.5,.5,1)',
			// ページネーションと相性が悪いので
			//delay: typeof binding.value === 'number' ? binding.value * 30 : 0,
		});
	},
} as Directive<HTMLElement>;
