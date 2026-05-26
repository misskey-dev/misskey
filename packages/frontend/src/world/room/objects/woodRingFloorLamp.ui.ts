/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { woodRingFloorLamp_schema } from 'misskey-world/src/room/objects/woodRingFloorLamp.schema.js';
import { i18n } from '@/i18n.js';

export const woodRingFloorLamp_ui = defineObjectUi<typeof woodRingFloorLamp_schema>({
	name: i18n.ts._miRoom._objects.woodRingFloorLamp,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._objects._woodRingFloorLamp.shadeMat,
		},
		bodyMat: {
			label: i18n.ts._miRoom._objects._woodRingFloorLamp.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._objects._woodRingFloorLamp.light,
		},
	},
});
