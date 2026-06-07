/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { ceilingFan_schema } from 'misskey-world/src/room/furnitures/ceilingFan.schema.js';
import { i18n } from '@/i18n.js';

export const ceilingFan_ui = defineFurnitureUi<typeof ceilingFan_schema>({
	name: i18n.ts._miRoom._furnitures.ceilingFan,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._furnitures._ceilingFan.shadeMat,
		},
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._ceilingFan.bodyMat,
		},
	},
});
