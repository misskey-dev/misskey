/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { allInOnePc_schema } from 'misskey-world/src/room/furnitures/allInOnePc.schema.js';
import { i18n } from '@/i18n.js';

export const allInOnePc_ui = defineFurnitureUi<typeof allInOnePc_schema>({
	name: i18n.ts._miRoom._furnitures.allInOnePc,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._allInOnePc.bodyMat,
		},
		bezelMat: {
			label: i18n.ts._miRoom._furnitures._allInOnePc.bezelMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._furnitures._allInOnePc.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._furnitures._allInOnePc.image,
			presets: {
				'desktop': {
					label: i18n.ts._miRoom._furnitures._allInOnePc.image_desktop,
				},
			},
		},
	},
});
