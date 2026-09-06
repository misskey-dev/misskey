/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { cardboardBox_schema } from 'misskey-world/src/room/furnitures/cardboardBox.schema.js';
import { i18n } from '@/i18n.js';

export const cardboardBox_ui = defineFurnitureUi<typeof cardboardBox_schema>({
	name: i18n.ts._miRoom._furnitures.cardboardBox,
	options: {
		variation: {
			label: i18n.ts._miRoom._furnitures._cardboardBox.variation,
			enum: {
				'default': {
					label: i18n.ts._miRoom._furnitures._cardboardBox.variation_default,
				},
				'mikan': {
					label: i18n.ts._miRoom._furnitures._cardboardBox.variation_mikan,
				},
				'aizon': {
					label: i18n.ts._miRoom._furnitures._cardboardBox.variation_aizon,
				},
			},
		},
	},
});
