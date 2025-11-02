/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getScrollContainer, getScrollPosition } from '@@/js/scroll.js';

interface HTMLElementWithRO extends HTMLElement {
	_ro_?: ResizeObserver;
}

export const followAppendDirective = {
	mounted(src, binding) {
		if (binding.value === false) return;

		let isBottom = true;

		const container = getScrollContainer(src)!;
		container.addEventListener('scroll', () => {
			const pos = getScrollPosition(container);
			const viewHeight = container.clientHeight;
			const height = container.scrollHeight;
			isBottom = (pos + viewHeight > height - 32);
		}, { passive: true });
		container.scrollTop = container.scrollHeight;

		const ro = new ResizeObserver((entries, observer) => {
			if (isBottom) {
				const height = container.scrollHeight;
				container.scrollTop = height;
			}
		});

		ro.observe(src);

		// TODO: 新たにプロパティを作るのをやめMapを使う
		src._ro_ = ro;
	},

	unmounted(src) {
		if (src._ro_) src._ro_.unobserve(src);
	},
} as Directive<HTMLElementWithRO, boolean>;
