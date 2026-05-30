/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { ironFrameTable_schema } from 'misskey-world/src/room/furnitures/ironFrameTable.schema.js';
import { i18n } from '@/i18n.js';

export const ironFrameTable_ui = defineFurnitureUi<typeof ironFrameTable_schema>({
	name: i18n.ts._miRoom._objects.ironFrameTable,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._ironFrameTable.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._ironFrameTable.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._ironFrameTable.width,
		},
		depth: {
			label: i18n.ts._miRoom._objects._ironFrameTable.depth,
		},
		height: {
			label: i18n.ts._miRoom._objects._ironFrameTable.height,
		},
	},
});
