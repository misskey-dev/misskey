/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tabletopIronFrameStand_schema } from 'misskey-world/src/room/furnitures/tabletopIronFrameStand.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopIronFrameStand_ui = defineFurnitureUi<typeof tabletopIronFrameStand_schema>({
	name: i18n.ts._miRoom._furnitures.tabletopIronFrameStand,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._tabletopIronFrameStand.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._furnitures._tabletopIronFrameStand.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._furnitures._tabletopIronFrameStand.width,
		},
		depth: {
			label: i18n.ts._miRoom._furnitures._tabletopIronFrameStand.depth,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._tabletopIronFrameStand.height,
		},
	},
});
