/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { chair_schema } from 'misskey-world/src/room/furnitures/chair.schema.js';
import { i18n } from '@/i18n.js';

export const chair_ui = defineFurnitureUi<typeof chair_schema>({
	name: i18n.ts._miRoom._furnitures.chair,
	options: {
		primaryMat: {
			label: i18n.ts._miRoom._furnitures._chair.primaryMat,
		},
		secondaryMat: {
			label: i18n.ts._miRoom._furnitures._chair.secondaryMat,
		},
		frameMat: {
			label: i18n.ts._miRoom._furnitures._chair.frameMat,
		},
	},
});
