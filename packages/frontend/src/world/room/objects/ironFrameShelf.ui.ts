/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ironFrameShelf } from './ironFrameShelf.js';
import { i18n } from '@/i18n.js';

export const ironFrameShelf_ui = defineObjectUi<typeof ironFrameShelf>({
	name: i18n.ts._miRoom._objects.ironFrameShelf5,
	options: {
		height: {
			label: i18n.ts._miRoom._objects._ironFrameShelf.height,
			enum: {
				'5': { label: '5' },
				'4': { label: '4' },
				'3': { label: '3' },
			},
		},
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
