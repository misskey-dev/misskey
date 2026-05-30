/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { laptopPc_schema } from 'misskey-world/src/room/furnitures/laptopPc.schema.js';
import { i18n } from '@/i18n.js';

export const laptopPc_ui = defineFurnitureUi<typeof laptopPc_schema>({
	name: i18n.ts._miRoom._objects.laptopPc,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._laptopPc.bodyMat,
		},
		bezelMat: {
			label: i18n.ts._miRoom._objects._laptopPc.bezelMat,
		},
		screenBrightness: {
			label: i18n.ts._miRoom._objects._laptopPc.screenBrightness,
		},
		image: {
			label: i18n.ts._miRoom._objects._laptopPc.image,
		},
		openAngle: {
			label: i18n.ts._miRoom._objects._laptopPc.openAngle,
		},
	},
});
