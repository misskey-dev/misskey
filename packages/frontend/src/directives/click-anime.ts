/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { prefer } from '@/preferences.js';

const abortControllers = new WeakMap<HTMLElement, AbortController>();

export const clickAnimeDirective = {
	mounted(el) {
		if (!prefer.s.animation) return;

		const target = el.children[0];

		if (target == null) return;

		const abortController = new AbortController();
		abortControllers.set(el, abortController);

		target.classList.add('_anime_bounce_standBy');

		el.addEventListener('mousedown', () => {
			target.classList.remove('_anime_bounce');

			target.classList.add('_anime_bounce_standBy');
			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			});
		}, { signal: abortController.signal });

		el.addEventListener('click', () => {
			target.classList.add('_anime_bounce');
			target.classList.remove('_anime_bounce_ready');
		}, { signal: abortController.signal });

		el.addEventListener('animationend', () => {
			target.classList.remove('_anime_bounce');
			target.classList.add('_anime_bounce_standBy');
		}, { signal: abortController.signal });
	},

	beforeUnmount(el) {
		if (!prefer.s.animation) return;

		const abortController = abortControllers.get(el);
		if (abortController) {
			abortController.abort();
			abortControllers.delete(el);
		}
	},
} as Directive<HTMLElement>;
