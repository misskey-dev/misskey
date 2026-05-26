/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { spotLight_schema } from 'misskey-world/src/room/objects/spotLight.schema.js';
import { i18n } from '@/i18n.js';

export const spotLight_ui = defineObjectUi<typeof spotLight_schema>({
	name: i18n.ts._miRoom._objects.spotLight,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._spotLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._objects._spotLight.light,
		},
		angleV: {
			label: i18n.ts._miRoom._objects._spotLight.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._objects._spotLight.angleH,
		},
	},
});
