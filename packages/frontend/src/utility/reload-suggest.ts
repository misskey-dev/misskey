/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';

export const shouldSuggestReload = ref(false);

export function suggestReload() {
	shouldSuggestReload.value = true;
}
