/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ironFrameShelf5, ironFrameShelf4, ironFrameShelf3 } from './ironFrameShelf.js';
import { i18n } from '@/i18n.js';

export const ironFrameShelf5_ui = defineObjectUi<typeof ironFrameShelf5>({
	name: i18n.ts._miRoom._objects.ironFrameShelf5,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.width,
		},
	},
});

export const ironFrameShelf4_ui = defineObjectUi<typeof ironFrameShelf4>({
	name: i18n.ts._miRoom._objects.ironFrameShelf4,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.width,
		},
	},
});

export const ironFrameShelf3_ui = defineObjectUi<typeof ironFrameShelf3>({
	name: i18n.ts._miRoom._objects.ironFrameShelf3,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.width,
		},
	},
});
