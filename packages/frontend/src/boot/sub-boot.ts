/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp } from 'vue';
import { common } from './common.js';
import { emojiPicker } from '@/utility/emoji-picker.js';
import UiMinimum from '@/ui/minimum.vue';

export async function subBoot() {
	const res = await common(async () => createApp(UiMinimum));

	if (res.aborted) {
		return;
	}

	emojiPicker.init();
}
