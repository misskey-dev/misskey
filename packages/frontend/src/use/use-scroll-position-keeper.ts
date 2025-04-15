/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import { nextTick, onActivated, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';

// note render skippingがオンだとズレるため、遷移直前にスクロール範囲に表示されているdata-scroll-anchor要素を特定して、復元時に当該要素までスクロールするようにする

export function useScrollPositionKeeper(scrollContainerRef: Ref<HTMLElement | null | undefined>): void {
	let anchorId: string | null = null;

	watch(scrollContainerRef, (el) => {
		if (!el) return;

		const onScroll = () => {
			if (!el) return;
			const scrollContainerRect = el.getBoundingClientRect();
			const viewPosition = scrollContainerRect.height / 2;

			const anchorEls = el.querySelectorAll('[data-scroll-anchor]');
			for (let i = anchorEls.length - 1; i > -1; i--) { // 下から見た方が速い
				const anchorEl = anchorEls[i] as HTMLElement;
				const anchorRect = anchorEl.getBoundingClientRect();
				const anchorTop = anchorRect.top;
				const anchorBottom = anchorRect.bottom;
				if (anchorTop <= viewPosition && anchorBottom >= viewPosition) {
					anchorId = anchorEl.getAttribute('data-scroll-anchor');
					break;
				}
			}
		};

		// ほんとはscrollイベントじゃなくてonBeforeDeactivatedでやりたい
		// https://github.com/vuejs/vue/issues/9454
		// https://github.com/vuejs/rfcs/pull/284
		el.addEventListener('scroll', throttle(1000, onScroll), { passive: true });
	}, {
		immediate: true,
	});

	onActivated(() => {
		nextTick(() => {
			if (!anchorId) return;
			const scrollContainer = scrollContainerRef.value;
			if (!scrollContainer) return;
			const scrollAnchorEl = scrollContainer.querySelector(`[data-scroll-anchor="${anchorId}"]`);
			if (!scrollAnchorEl) return;
			scrollAnchorEl.scrollIntoView({
				behavior: 'instant',
				block: 'center',
				inline: 'center',
			});
		});
	});
}
