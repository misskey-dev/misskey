/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { issyoubin_schema } from 'misskey-world/src/room/furnitures/issyoubin.schema.js';
import { i18n } from '@/i18n.js';

export const issyoubin_ui = defineFurnitureUi<typeof issyoubin_schema>({
	name: i18n.ts._miRoom._objects.issyoubin,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._issyoubin.variation,
			enum: {
				'misuki': {
					label: 'A',
				},
				'ai': {
					label: 'B',
				},
			},
		},
	},
});
