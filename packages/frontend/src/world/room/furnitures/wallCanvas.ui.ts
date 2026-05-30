/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { wallCanvas_schema } from 'misskey-world/src/room/furnitures/wallCanvas.schema.js';
import { i18n } from '@/i18n.js';

export const wallCanvas_ui = defineFurnitureUi<typeof wallCanvas_schema>({
	name: i18n.ts._miRoom._objects.wallCanvas,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._wallCanvas.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._wallCanvas.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._wallCanvas.image,
		},
	},
});
