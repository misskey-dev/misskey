/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { woodRingFloorLamp_schema } from 'misskey-world/src/room/furnitures/woodRingFloorLamp.schema.js';
import { i18n } from '@/i18n.js';

export const woodRingFloorLamp_ui = defineFurnitureUi<typeof woodRingFloorLamp_schema>({
	name: i18n.ts._miRoom._furnitures.woodRingFloorLamp,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._furnitures._woodRingFloorLamp.shadeMat,
		},
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._woodRingFloorLamp.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._woodRingFloorLamp.light,
		},
	},
});
