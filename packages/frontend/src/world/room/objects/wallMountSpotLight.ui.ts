/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wallMountSpotLight_schema } from 'misskey-world/src/room/objects/wallMountSpotLight.schema.js';
import { i18n } from '@/i18n.js';

export const wallMountSpotLight_ui = defineFunitureUi<typeof wallMountSpotLight_schema>({
	name: i18n.ts._miRoom._objects.wallMountSpotLight,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._wallMountSpotLight.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._objects._wallMountSpotLight.light,
		},
		angleV: {
			label: i18n.ts._miRoom._objects._wallMountSpotLight.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._objects._wallMountSpotLight.angleH,
		},
	},
});
