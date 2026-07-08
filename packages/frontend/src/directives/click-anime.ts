/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { prefer } from '@/preferences.js';

type ClickAnimeDirectiveState = {
	mousedownHandler: (ev: MouseEvent) => void;
	clickHandler: (ev: MouseEvent) => void;
	animationendHandler: (ev: AnimationEvent) => void;
};

const states = new WeakMap<HTMLElement, ClickAnimeDirectiveState>();

export const clickAnimeDirective = {
	mounted(el) {
		if (!prefer.s.animation) return;

		const target = el.children[0];

		if (target == null) return;

		target.classList.add('_anime_bounce_standBy');

		const mousedownHandler = () => {
			target.classList.remove('_anime_bounce');

			target.classList.add('_anime_bounce_standBy');
			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			});
		};

		const clickHandler = () => {
			target.classList.add('_anime_bounce');
			target.classList.remove('_anime_bounce_ready');
		};

		const animationendHandler = () => {
			target.classList.remove('_anime_bounce');
			target.classList.add('_anime_bounce_standBy');
		};

		el.addEventListener('mousedown', mousedownHandler);
		el.addEventListener('click', clickHandler);
		el.addEventListener('animationend', animationendHandler);

		states.set(el, {
			mousedownHandler,
			clickHandler,
			animationendHandler,
		});
	},

	beforeUnmount(el) {
		if (!prefer.s.animation) return;

		const state = states.get(el);
		if (state == null) return;

		el.removeEventListener('mousedown', state.mousedownHandler);
		el.removeEventListener('click', state.clickHandler);
		el.removeEventListener('animationend', state.animationendHandler);
		states.delete(el);
	},
} as Directive<HTMLElement>;
