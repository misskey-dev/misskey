/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tv_schema } from 'misskey-world/src/room/objects/tv.schema.js';
import { i18n } from '@/i18n.js';

export const tv_ui = defineObjectUi<typeof tv_schema>({
	name: i18n.ts._miRoom._objects.tv,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._tv.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._tv.screenBrightness,
		},
	},
});
