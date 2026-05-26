/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { throttle } from 'throttle-debounce';
import { nextTick, onActivated, onDeactivated, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';

// note render skippingがオンだとズレるため、遷移直前にスクロール範囲に表示されているdata-scroll-anchor要素を特定して、復元時に当該要素までスクロールするようにする

// TODO: data-scroll-anchor がひとつも存在しない場合、または手動で useAnchor みたいなフラグをfalseで呼ばれた場合、単純にスクロール位置を使用する処理にフォールバックするようにする

export function useScrollPositionKeeper(scrollContainerRef: Ref<HTMLElement | null | undefined>): void {
	let anchorId: string | null = null;
	let anchorIndex = 0;
	let anchorViewOffset = 0;
	let savedScrollTop = 0;
	let ready = true;

	watch(scrollContainerRef, (el) => {
		if (!el) return;

		const captureAnchor = () => {
			if (!el) return;
			if (!ready) return;

			if (el.scrollTop < 100) {
				// 上部にいるときはanchorを参照するとズレの原因になるし位置復元するメリットも乏しいため設定しない
				anchorId = null;
				return;
			}

			const scrollContainerRect = el.getBoundingClientRect();
			const viewPosition = scrollContainerRect.top + scrollContainerRect.height / 2;

			const anchorEls = el.querySelectorAll('[data-scroll-anchor]');
			for (let i = anchorEls.length - 1; i > -1; i--) { // 下から見た方が速い
				const anchorEl = anchorEls[i] as HTMLElement;
				const anchorRect = anchorEl.getBoundingClientRect();
				const anchorTop = anchorRect.top;
				const anchorBottom = anchorRect.bottom;
				if (anchorTop <= viewPosition && anchorBottom >= viewPosition) {
					anchorId = anchorEl.getAttribute('data-scroll-anchor');
					const allWithSameId = el.querySelectorAll(`[data-scroll-anchor="${CSS.escape(anchorId!)}"]`);
					anchorIndex = Array.from(allWithSameId).indexOf(anchorEl);
					anchorViewOffset = viewPosition - anchorTop;
					break;
				}
			}
		};

		// ほんとはscrollイベントじゃなくてonBeforeDeactivatedでやりたい
		// https://github.com/vuejs/vue/issues/9454
		// https://github.com/vuejs/rfcs/pull/284
		el.addEventListener('scroll', throttle(1000, captureAnchor), { passive: true });
		// スクロール後すぐにクリックするとthrottleによりanchorIdが古いまま残るため、
		// pointerdownで遷移直前のアンカーを同期的に取得する
		el.addEventListener('pointerdown', captureAnchor, { passive: true });
	}, {
		immediate: true,
	});

	const restore = () => {
		if (!anchorId) return;
		const scrollContainer = scrollContainerRef.value;
		if (!scrollContainer) return;
		const candidates = scrollContainer.querySelectorAll(`[data-scroll-anchor="${CSS.escape(anchorId)}"]`);
		const scrollAnchorEl = candidates[anchorIndex] ?? candidates[candidates.length - 1];
		if (!scrollAnchorEl) return;
		const containerRect = scrollContainer.getBoundingClientRect();
		const anchorRect = (scrollAnchorEl as HTMLElement).getBoundingClientRect();
		// anchorContentY: コンテンツ先頭からのアンカー要素上端の距離（scrollTopに依存しない）
		const anchorContentY = scrollContainer.scrollTop + (anchorRect.top - containerRect.top);
		// キャプチャ時と同じ位置関係になるようscrollTopを直接セット
		scrollContainer.scrollTop = anchorContentY - containerRect.height / 2 + anchorViewOffset;
	};

	onDeactivated(() => {
		const el = scrollContainerRef.value;
		if (el) savedScrollTop = el.scrollTop;
		ready = false;
	});

	onActivated(() => {
		restore();
		nextTick(() => {
			restore();
			window.setTimeout(() => {
				restore();

				// anchor方式が失敗した場合（anchorIdがnullまたは要素が見つからない場合）の
				// フォールバック
				const el = scrollContainerRef.value;
				if (el && el.scrollTop === 0 && savedScrollTop > 0) {
					el.scrollTop = savedScrollTop;
				}

				ready = true;
			}, 100);
		});
	});
}
