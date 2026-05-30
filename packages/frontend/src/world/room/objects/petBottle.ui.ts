/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { petBottle_schema } from 'misskey-world/src/room/objects/petBottle.schema.js';
import { i18n } from '@/i18n.js';

export const petBottle_ui = defineFunitureUi<typeof petBottle_schema>({
	name: i18n.ts._miRoom._objects.petBottle,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._petBottle.variation,
			enum: {
				'mineral-water': {
					label: i18n.ts._miRoom._objects._petBottle.variation_mineralWater,
				},
				'green-tea': {
					label: i18n.ts._miRoom._objects._petBottle.variation_greenTea,
				},
			},
		},
		withCap: {
			label: i18n.ts._miRoom._objects._petBottle.withCap,
		},
		withLabel: {
			label: i18n.ts._miRoom._objects._petBottle.withLabel,
		},
		empty: {
			label: i18n.ts._miRoom._objects._petBottle.empty,
		},
	},
});
