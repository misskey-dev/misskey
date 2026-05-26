/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { poster_schema } from 'misskey-world/src/room/objects/poster.schema.js';
import { i18n } from '@/i18n.js';

export const poster_ui = defineObjectUi<typeof poster_schema>({
	name: i18n.ts._miRoom._objects.poster,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._poster.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._poster.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._poster.image,
		},
	},
});
