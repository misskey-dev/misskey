/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tabletopPictureFrame_schema } from 'misskey-world/src/room/furnitures/tabletopPictureFrame.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopPictureFrame_ui = defineFurnitureUi<typeof tabletopPictureFrame_schema>({
	name: i18n.ts._miRoom._furnitures.tabletopPictureFrame,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.frameMat,
		},
		width: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.width,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.height,
		},
		frameThickness: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.frameThickness,
		},
		depth: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.depth,
		},
		matHThickness: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.matHThickness,
		},
		matVThickness: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.matVThickness,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._tabletopPictureFrame.image,
		},
	},
});
