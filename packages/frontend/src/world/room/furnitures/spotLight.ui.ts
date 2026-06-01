/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { spotLight_schema } from 'misskey-world/src/room/furnitures/spotLight.schema.js';
import { i18n } from '@/i18n.js';

export const spotLight_ui = defineFurnitureUi<typeof spotLight_schema>({
	name: i18n.ts._miRoom._furnitures.spotLight,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._spotLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._spotLight.light,
		},
		angleV: {
			label: i18n.ts._miRoom._furnitures._spotLight.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._furnitures._spotLight.angleH,
		},
	},
});
