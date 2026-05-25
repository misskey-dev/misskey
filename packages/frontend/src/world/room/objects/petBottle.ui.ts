/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { petBottle } from './petBottle.js';
import { i18n } from '@/i18n.js';

export const petBottle_ui = defineObjectUi<typeof petBottle>({
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
