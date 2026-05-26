/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { woodRingsPendantLight_schema } from 'misskey-world/src/room/objects/woodRingsPendantLight.schema.js';
import { i18n } from '@/i18n.js';

export const woodRingsPendantLight_ui = defineObjectUi<typeof woodRingsPendantLight_schema>({
	name: i18n.ts._miRoom._objects.woodRingsPendantLight,
	options: {
		shadeMat: {
			label: i18n.ts._miRoom._objects._woodRingsPendantLight.shadeMat,
		},
		bodyMat: {
			label: i18n.ts._miRoom._objects._woodRingsPendantLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._objects._woodRingsPendantLight.light,
		},
		length: {
			label: i18n.ts._miRoom._objects._woodRingsPendantLight.length,
		},
	},
});
