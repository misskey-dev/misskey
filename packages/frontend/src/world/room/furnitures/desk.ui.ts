/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { desk_schema } from 'misskey-world/src/room/furnitures/desk.schema.js';
import { i18n } from '@/i18n.js';

export const desk_ui = defineFurnitureUi<typeof desk_schema>({
	name: i18n.ts._miRoom._furnitures.desk,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._desk.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._furnitures._desk.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._furnitures._desk.width,
		},
		depth: {
			label: i18n.ts._miRoom._furnitures._desk.depth,
		},
	},
});
