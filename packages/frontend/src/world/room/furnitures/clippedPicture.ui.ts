/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { clippedPicture_schema } from 'misskey-world/src/room/furnitures/clippedPicture.schema.js';
import { i18n } from '@/i18n.js';

export const clippedPicture_ui = defineFurnitureUi<typeof clippedPicture_schema>({
	name: i18n.ts._miRoom._furnitures.clippedPicture,
	options: {
		width: {
			label: i18n.ts._miRoom._furnitures._clippedPicture.width,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._clippedPicture.height,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._clippedPicture.image,
		},
	},
});
