/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref,  watch } from 'vue';

const FOLDER_PAGE_HASH_PREFIX = 'fp_';

export const pageFolderTeleportedIds = ref<string[]>([]);

window.addEventListener('popstate', () => {
	const newHash = location.hash.split('#')[1] ?? '';
	let newHashIds: string[] | null = null;

	if (newHash.startsWith(FOLDER_PAGE_HASH_PREFIX)) {
		newHashIds = newHash
			.slice(FOLDER_PAGE_HASH_PREFIX.length)
			.split(',');
	}

	if (newHashIds === null || newHashIds.length === 0) {
		pageFolderTeleportedIds.value = [];
	}

	if (newHashIds !== null) {
		pageFolderTeleportedIds.value = newHashIds;
	}
});

watch(pageFolderTeleportedIds, (newVal) => {
	const newHash = newVal.join(',');
	const expectedHash = newHash ? `#${FOLDER_PAGE_HASH_PREFIX}${newHash}` : location.pathname + location.search;
	if (location.hash !== expectedHash) {
		history.pushState(null, '', expectedHash);
	}
}, { immediate: true, deep: true });
