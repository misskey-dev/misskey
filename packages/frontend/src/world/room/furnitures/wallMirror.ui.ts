/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { wallMirror_schema } from 'misskey-world/src/room/furnitures/wallMirror.schema.js';
import { i18n } from '@/i18n.js';

export const wallMirror_ui = defineFurnitureUi<typeof wallMirror_schema>({
	name: i18n.ts._miRoom._furnitures.wallMirror,
	options: {
		width: {
			label: i18n.ts._miRoom._furnitures._wallMirror.width,
		},
		height: {
			label: i18n.ts._miRoom._furnitures._wallMirror.height,
		},
		frameThickness: {
			label: i18n.ts._miRoom._furnitures._wallMirror.frameThickness,
		},
		frameMat: {
			label: i18n.ts._miRoom._furnitures._wallMirror.frameMat,
		},
	},
});
