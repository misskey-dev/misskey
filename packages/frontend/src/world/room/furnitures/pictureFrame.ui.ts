/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { pictureFrame_schema } from 'misskey-world/src/room/furnitures/pictureFrame.schema.js';
import { i18n } from '@/i18n.js';

export const pictureFrame_ui = defineFurnitureUi<typeof pictureFrame_schema>({
	name: i18n.ts._miRoom._furnitures.pictureFrame,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.frameMat,
		},
		width: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.width,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.height,
		},
		frameThickness: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.frameThickness,
		},
		depth: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.depth,
		},
		matHThickness: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.matHThickness,
		},
		matVThickness: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.matVThickness,
		},
		withCover: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.withCover,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._pictureFrame.image,
		},
	},
});
