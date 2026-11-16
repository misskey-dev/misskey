/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { prefer } from '@/preferences.js';

const abortControllers = new WeakMap<HTMLElement, AbortController>();

const bounceKeyframes: Keyframe[] = [
	{ offset: 0, transform: 'scale(0.9)', easing: 'ease' },
	{ offset: 0.19, transform: 'scale(1.1)', easing: 'ease' },
	{ offset: 0.48, transform: 'scale(0.95)', easing: 'ease' },
	{ offset: 1, transform: 'scale(1)' },
];

export const clickAnimeDirective = {
	mounted(el) {
		if (!prefer.s.animation) return;

		const target = el.children[0];

		if (target == null) return;

		const abortController = new AbortController();
		abortControllers.set(el, abortController);

		let bounceAnimation: Animation | null = null;

		target.classList.add('_anime_bounce_standBy');

		el.addEventListener('mousedown', () => {
			bounceAnimation?.cancel();
			bounceAnimation = null;

			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			}, { once: true, signal: abortController.signal });
		}, { signal: abortController.signal });

		el.addEventListener('click', () => {
			target.classList.remove('_anime_bounce_ready');

			bounceAnimation?.cancel();
			bounceAnimation = target.animate(bounceKeyframes, { duration: 700 });
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
