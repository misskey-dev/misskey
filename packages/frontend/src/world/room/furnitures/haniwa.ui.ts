/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { haniwa_schema } from 'misskey-world/src/room/furnitures/haniwa.schema.js';
import { i18n } from '@/i18n.js';

export const haniwa_ui = defineFurnitureUi<typeof haniwa_schema>({
	name: i18n.ts._miRoom._furnitures.haniwa,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._haniwa.bodyMat,
		},
		insideColor: {
			label: i18n.ts._miRoom._furnitures._haniwa.insideColor,
		},
	},
});
