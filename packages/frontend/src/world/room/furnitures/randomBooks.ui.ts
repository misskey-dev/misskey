/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { randomBooks_schema } from 'misskey-world/src/room/furnitures/randomBooks.schema.js';
import { i18n } from '@/i18n.js';

export const randomBooks_ui = defineFurnitureUi<typeof randomBooks_schema>({
	name: i18n.ts._miRoom._objects.randomBooks,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._randomBooks.variation,
			enum: {
				'mix': {
					label: i18n.ts._miRoom._objects._randomBooks.variation_mix,
				},
				'mix-plain': {
					label: i18n.ts._miRoom._objects._randomBooks.variation_mixPlain,
				},
			},
		},
		count: {
			label: i18n.ts._miRoom._objects._randomBooks.count,
		},
		stackVertically: {
			label: i18n.ts._miRoom._objects._randomBooks.stackVertically,
		},
		seed: {
			label: i18n.ts._miRoom._objects._randomBooks.seed,
		},
	},
});
