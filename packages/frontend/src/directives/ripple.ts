/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { popup } from '@/os.js';

export default {
	mounted(el, binding, vn) {
		// 明示的に false であればバインドしない
		if (binding.value === false) return;

		el.addEventListener('click', () => {
			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);

			const { dispose } = popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		});
	},
};
