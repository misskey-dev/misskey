/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { ceilingFanLight_schema } from 'misskey-world/src/room/furnitures/ceilingFanLight.schema.js';
import { i18n } from '@/i18n.js';

export const ceilingFanLight_ui = defineFurnitureUi<typeof ceilingFanLight_schema>({
	name: i18n.ts._miRoom._furnitures.ceilingFanLight,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._furnitures._ceilingFanLight.shadeMat,
		},
	},
});
