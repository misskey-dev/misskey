/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { electronicDisplayBoard_schema } from 'misskey-world/src/room/furnitures/electronicDisplayBoard.schema.js';
import { i18n } from '@/i18n.js';

export const electronicDisplayBoard_ui = defineFurnitureUi<typeof electronicDisplayBoard_schema>({
	name: i18n.ts._miRoom._furnitures.electronicDisplayBoard,
	options: {
		text: {
			label: i18n.ts._miRoom._furnitures._electronicDisplayBoard.text,
		},
		frameMat: {
			label: i18n.ts._miRoom._furnitures._electronicDisplayBoard.frameMat,
		},
		ledColor: {
			label: i18n.ts._miRoom._furnitures._electronicDisplayBoard.ledColor,
		},
		ledBrightness: {
			label: i18n.ts._miRoom._furnitures._electronicDisplayBoard.ledBrightness,
		},
	},
});
