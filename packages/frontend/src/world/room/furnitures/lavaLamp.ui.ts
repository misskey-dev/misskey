/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { lavaLamp_schema } from 'misskey-world/src/room/furnitures/lavaLamp.schema.js';
import { i18n } from '@/i18n.js';

export const lavaLamp_ui = defineFurnitureUi<typeof lavaLamp_schema>({
	name: i18n.ts._miRoom._furnitures.lavaLamp,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._lavaLamp.bodyMat,
		},
		glassMat: {
			label: i18n.ts._miRoom._furnitures._lavaLamp.glassMat,
		},
		lightColor: {
			label: i18n.ts._miRoom._furnitures._lavaLamp.lightColor,
		},
		lavaColor: {
			label: i18n.ts._miRoom._furnitures._lavaLamp.lavaColor,
		},
	},
});
