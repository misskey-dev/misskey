/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { handheldGameConsole_schema } from 'misskey-world/src/room/furnitures/handheldGameConsole.schema.js';
import { i18n } from '@/i18n.js';

export const handheldGameConsole_ui = defineFurnitureUi<typeof handheldGameConsole_schema>({
	name: i18n.ts._miRoom._furnitures.handheldGameConsole,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._handheldGameConsole.bodyMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._furnitures._handheldGameConsole.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._handheldGameConsole.image,
		},
	},
});
