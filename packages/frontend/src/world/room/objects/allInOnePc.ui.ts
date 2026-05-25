/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { allInOnePc_schema } from './allInOnePc.schema.js';
import { i18n } from '@/i18n.js';

export const allInOnePc_ui = defineObjectUi<typeof allInOnePc_schema>({
	name: i18n.ts._miRoom._objects.allInOnePc,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._allInOnePc.bodyMat,
		},
		bezelMat: {
			label: i18n.ts._miRoom._objects._allInOnePc.bezelMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._allInOnePc.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._allInOnePc.image,
			presets: {
				'desktop': {
					label: i18n.ts._miRoom._objects._allInOnePc.image_desktop,
				},
			},
		},
	},
});
