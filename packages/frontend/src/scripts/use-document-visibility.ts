/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onMounted, onUnmounted, ref, Ref } from 'vue';

export function useDocumentVisibility(): Ref<DocumentVisibilityState> {
	const visibility = ref(document.visibilityState);

	const onChange = (): void => {
		visibility.value = document.visibilityState;
	};

	onMounted(() => {
		document.addEventListener('visibilitychange', onChange);
	});

	onUnmounted(() => {
		document.removeEventListener('visibilitychange', onChange);
	});

	return visibility;
}
