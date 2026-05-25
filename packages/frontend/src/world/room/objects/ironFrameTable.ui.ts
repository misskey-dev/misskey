/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ironFrameTable } from './ironFrameTable.js';
import { i18n } from '@/i18n.js';

export const ironFrameTable_ui = defineObjectUi<typeof ironFrameTable>({
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
