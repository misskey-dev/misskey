/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { clippedPicture_schema } from 'misskey-world/src/room/objects/clippedPicture.schema.js';
import { i18n } from '@/i18n.js';

export const clippedPicture_ui = defineFunitureUi<typeof clippedPicture_schema>({
	name: i18n.ts._miRoom._objects.clippedPicture,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._clippedPicture.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._clippedPicture.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._clippedPicture.image,
		},
	},
});
