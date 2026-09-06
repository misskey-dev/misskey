/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { woodRingsPendantLight_schema } from 'misskey-world/src/room/furnitures/woodRingsPendantLight.schema.js';
import { i18n } from '@/i18n.js';

export const woodRingsPendantLight_ui = defineFurnitureUi<typeof woodRingsPendantLight_schema>({
	name: i18n.ts._miRoom._furnitures.woodRingsPendantLight,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._furnitures._woodRingsPendantLight.shadeMat,
		},
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._woodRingsPendantLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._woodRingsPendantLight.light,
		},
		length: {
			label: i18n.ts._miRoom._furnitures._woodRingsPendantLight.length,
		},
	},
});
