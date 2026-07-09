/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { prefer } from '@/preferences.js';
import { popup } from '@/os.js';

const handlers = new WeakMap<HTMLElement, (ev: MouseEvent) => void>();
const abortControllers = new WeakMap<HTMLElement, AbortController>();

export const rippleDirective = {
	mounted(el, binding) {
		// 明示的に false であればバインドしない
		if (binding.value === false) return;
		if (!prefer.s.animation) return;

		const abortController = new AbortController();

		el.addEventListener('click', () => {
			const rect = el.getBoundingClientRect();

			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);

			const { dispose } = popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		}, { passive: true, signal: abortController.signal });

		abortControllers.set(el, abortController);
	},

	beforeUnmount(el) {
		const abortController = abortControllers.get(el);
		if (abortController) {
			abortController.abort();
			abortControllers.delete(el);
		}
	},
} as Directive<HTMLElement, boolean | null | undefined>;
