/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { tabletopIronFrameStand_schema } from './tabletopIronFrameStand.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopIronFrameStand_ui = defineObjectUi<typeof tabletopIronFrameStand_schema>({
	name: i18n.ts._miRoom._objects.tabletopIronFrameStand,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._tabletopIronFrameStand.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._tabletopIronFrameStand.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._tabletopIronFrameStand.width,
		},
		depth: {
			label: i18n.ts._miRoom._objects._tabletopIronFrameStand.depth,
		},
		height: {
			label: i18n.ts._miRoom._objects._tabletopIronFrameStand.height,
		},
	},
});
