/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { keyboard } from './keyboard.js';
import { i18n } from '@/i18n.js';

export const keyboard_ui = defineObjectUi<typeof keyboard>({
	name: i18n.ts._miRoom._objects.keyboard,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._keyboard.bodyMat,
		},
		keyMat: {
			label: i18n.ts._miRoom._objects._keyboard.keyMat,
		},
	},
});
