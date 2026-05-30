/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { tapestry_schema } from 'misskey-world/src/room/objects/tapestry.schema.js';
import { i18n } from '@/i18n.js';

export const tapestry_ui = defineFunitureUi<typeof tapestry_schema>({
	name: i18n.ts._miRoom._objects.tapestry,
	options: {
		width: {
			label: i18n.ts._miRoom._objects._tapestry.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._tapestry.height,
		},
		image: {
			label: i18n.ts._miRoom._objects._tapestry.image,
		},
	},
});
