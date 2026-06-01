/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { hangingDuctRail_schema } from 'misskey-world/src/room/furnitures/hangingDuctRail.schema.js';
import { i18n } from '@/i18n.js';

export const hangingDuctRail_ui = defineFurnitureUi<typeof hangingDuctRail_schema>({
	name: i18n.ts._miRoom._furnitures.hangingDuctRail,
	options: {
		width: {
			label: i18n.ts._miRoom._furnitures._hangingDuctRail.width,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._hangingDuctRail.height,
		},
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._hangingDuctRail.bodyMat,
		},
	},
});
