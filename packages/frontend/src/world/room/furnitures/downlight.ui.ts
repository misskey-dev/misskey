/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { downlight_schema } from 'misskey-world/src/room/furnitures/downlight.schema.js';
import { i18n } from '@/i18n.js';

export const downlight_ui = defineFurnitureUi<typeof downlight_schema>({
	name: i18n.ts._miRoom._furnitures.downlight,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._downlight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._furnitures._downlight.light,
		},
	},
});
