/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getScrollContainer, getScrollPosition } from '@@/js/scroll.js';

const states = new WeakMap<HTMLElement, {
	observer: ResizeObserver;
	abortController: AbortController;
}>();

export const followAppendDirective = {
	mounted(src, binding) {
		if (binding.value === false) return;

		const abortController = new AbortController();

		let isBottom = true;

		const container = getScrollContainer(src)!;
		container.addEventListener('scroll', () => {
			const pos = getScrollPosition(container);
			const viewHeight = container.clientHeight;
			const height = container.scrollHeight;
			isBottom = (pos + viewHeight > height - 32);
		}, { passive: true, signal: abortController.signal });
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
			abortController,
		});
	},

	beforeUnmount(src) {
		const state = states.get(src);
		if (!state) return;

		state.observer.disconnect();
		state.abortController.abort();
		states.delete(src);
	},
} as Directive<HTMLElement, boolean>;
