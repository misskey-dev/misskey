/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { largeMousepad_schema } from 'misskey-world/src/room/furnitures/largeMousepad.schema.js';
import { i18n } from '@/i18n.js';

export const largeMousepad_ui = defineFurnitureUi<typeof largeMousepad_schema>({
	name: i18n.ts._miRoom._objects.largeMousepad,
	options: {
		image: {
			label: i18n.ts._miRoom._objects._largeMousepad.image,
		},
	},
});
