/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wallCanvas_schema } from 'misskey-world/src/room/objects/wallCanvas.schema.js';
import { i18n } from '@/i18n.js';

export const wallCanvas_ui = defineFunitureUi<typeof wallCanvas_schema>({
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
