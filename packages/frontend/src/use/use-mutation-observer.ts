/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';

export function useMutationObserver(targetNodeRef: Ref<HTMLElement | null | undefined>, options: MutationObserverInit, callback: MutationCallback): void {
	const observer = new MutationObserver(callback);

	watch(targetNodeRef, (targetNode) => {
		if (targetNode) {
			observer.observe(targetNode, options);
		}
	}, { immediate: true });

	onUnmounted(() => {
		observer.disconnect();
	});
}
