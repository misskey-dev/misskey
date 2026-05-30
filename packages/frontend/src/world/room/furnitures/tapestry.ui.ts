/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tapestry_schema } from 'misskey-world/src/room/furnitures/tapestry.schema.js';
import { i18n } from '@/i18n.js';

export const tapestry_ui = defineFurnitureUi<typeof tapestry_schema>({
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
