/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { cardboardBox_schema } from 'misskey-world/src/room/objects/cardboardBox.schema.js';
import { i18n } from '@/i18n.js';

export const cardboardBox_ui = defineFunitureUi<typeof cardboardBox_schema>({
	name: i18n.ts._miRoom._objects.cardboardBox,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._cardboardBox.variation,
			enum: {
				'default': {
					label: i18n.ts._miRoom._objects._cardboardBox.variation_default,
				},
				'mikan': {
					label: i18n.ts._miRoom._objects._cardboardBox.variation_mikan,
				},
				'aizon': {
					label: i18n.ts._miRoom._objects._cardboardBox.variation_aizon,
				},
			},
		},
	},
});
