/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { newtonsCradle } from './newtonsCradle.js';
import { i18n } from '@/i18n.js';

export const newtonsCradle_ui = defineObjectUi<typeof newtonsCradle>({
	name: i18n.ts._miRoom._objects.newtonsCradle,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._newtonsCradle.frameMat,
		},
	},
});
