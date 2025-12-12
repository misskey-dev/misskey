/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, } from 'vue';
import UiMinimum from '@/ui/minimum.vue';
import { emojiPicker } from '@/utility/emoji-picker.js';
import { common } from './common.js';

export async function subBoot() {
	await common(async () => createApp(UiMinimum));

	emojiPicker.init();
}
