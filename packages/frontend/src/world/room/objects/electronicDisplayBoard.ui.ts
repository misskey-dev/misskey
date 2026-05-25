/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { electronicDisplayBoard_schema } from './electronicDisplayBoard.schema.js';
import { i18n } from '@/i18n.js';

export const electronicDisplayBoard_ui = defineObjectUi<typeof electronicDisplayBoard_schema>({
	name: i18n.ts._miRoom._objects.electronicDisplayBoard,
	options: {
		text: {
			label: i18n.ts._miRoom._objects._electronicDisplayBoard.text,
		},
		frameMat: {
			label: i18n.ts._miRoom._objects._electronicDisplayBoard.frameMat,
		},
		ledColor: {
			label: i18n.ts._miRoom._objects._electronicDisplayBoard.ledColor,
		},
		ledBrightness: {
			label: i18n.ts._miRoom._objects._electronicDisplayBoard.ledBrightness,
		},
	},
});
