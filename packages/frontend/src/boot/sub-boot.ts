/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineAsyncComponent } from 'vue';
import { common } from './common.js';
import type { CommonBootOptions } from './common.js';

export async function subBoot(options?: Partial<CommonBootOptions>, isEmbedPage?: boolean) {
	const { isClientUpdated } = await common(() => createApp(
		defineAsyncComponent(() => isEmbedPage ? import('@/ui/embed.vue') : import('@/ui/minimum.vue')),
	), options);
}
