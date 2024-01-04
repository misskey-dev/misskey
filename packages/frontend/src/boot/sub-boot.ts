/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineAsyncComponent } from 'vue';
import { common } from './common.js';

export async function subBoot() {
	const { isClientUpdated } = await common(() => createApp(
		defineAsyncComponent(() => import('@/ui/minimum.vue')),
	));
}
