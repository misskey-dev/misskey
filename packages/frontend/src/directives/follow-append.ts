/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getScrollContainer, getScrollPosition } from '@@/js/scroll.js';

const states = new WeakMap<HTMLElement, {
	observer: ResizeObserver;
	scrollHandlerTarget: HTMLElement;
	scrollHandler: (ev: Event) => void;
}>();

export const followAppendDirective = {
	mounted(src, binding) {
		if (binding.value === false) return;

		let isBottom = true;

		const container = getScrollContainer(src)!;
		const scrollHandler = () => {
			const pos = getScrollPosition(container);
			const viewHeight = container.clientHeight;
			const height = container.scrollHeight;
			isBottom = (pos + viewHeight > height - 32);
		};
		container.addEventListener('scroll', scrollHandler, { passive: true });
		container.scrollTop = container.scrollHeight;

		const ro = new ResizeObserver(() => {
			if (isBottom) {
				const height = container.scrollHeight;
				container.scrollTop = height;
			}
		});

		ro.observe(src);

		states.set(src, {
			observer: ro,
			scrollHandlerTarget: container,
			scrollHandler,
		});
	},

	beforeUnmount(src) {
		const state = states.get(src);
		if (!state) return;

		state.observer.disconnect();
		state.scrollHandlerTarget.removeEventListener('scroll', state.scrollHandler);
		states.delete(src);
	},
} as Directive<HTMLElement, boolean>;
