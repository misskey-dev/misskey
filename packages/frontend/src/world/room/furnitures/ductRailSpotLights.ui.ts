/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { ductRailSpotLights_schema } from 'misskey-world/src/room/furnitures/ductRailSpotLights.schema.js';
import { i18n } from '@/i18n.js';

export const ductRailSpotLights_ui = defineFurnitureUi<typeof ductRailSpotLights_schema>({
	name: i18n.ts._miRoom._furnitures.ductRailSpotLights,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._ductRailSpotLights.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._ductRailSpotLights.light,
		},
		angleV: {
			label: i18n.ts._miRoom._furnitures._ductRailSpotLights.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._furnitures._ductRailSpotLights.angleH,
		},
	},
});
