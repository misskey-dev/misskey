/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onMounted, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';

export function useDocumentVisibility(): Ref<DocumentVisibilityState> {
	const visibility = ref(window.document.visibilityState);

	const onChange = (): void => {
		visibility.value = window.document.visibilityState;
	};

	onMounted(() => {
		window.document.addEventListener('visibilitychange', onChange);
	});

	onUnmounted(() => {
		window.document.removeEventListener('visibilitychange', onChange);
	});

	return visibility;
}
