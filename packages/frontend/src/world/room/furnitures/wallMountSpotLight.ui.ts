/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { wallMountSpotLight_schema } from 'misskey-world/src/room/furnitures/wallMountSpotLight.schema.js';
import { i18n } from '@/i18n.js';

export const wallMountSpotLight_ui = defineFurnitureUi<typeof wallMountSpotLight_schema>({
	name: i18n.ts._miRoom._furnitures.wallMountSpotLight,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._wallMountSpotLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._wallMountSpotLight.light,
		},
		angleV: {
			label: i18n.ts._miRoom._furnitures._wallMountSpotLight.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._furnitures._wallMountSpotLight.angleH,
		},
	},
});
