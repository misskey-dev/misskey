/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ductRailSpotLights } from './ductRailSpotLights.js';
import { i18n } from '@/i18n.js';

export const ductRailSpotLights_ui = defineObjectUi<typeof ductRailSpotLights>({
	name: i18n.ts._miRoom._objects.ductRailSpotLights,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._ductRailSpotLights.bodyMat,
		},
		light: {
			label: i18n.ts._miRoom._objects._ductRailSpotLights.light,
		},
		angleV: {
			label: i18n.ts._miRoom._objects._ductRailSpotLights.angleV,
		},
		angleH: {
			label: i18n.ts._miRoom._objects._ductRailSpotLights.angleH,
		},
	},
});
