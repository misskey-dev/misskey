/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { tabletopFlag_schema } from 'misskey-world/src/room/furnitures/tabletopFlag.schema.js';
import { i18n } from '@/i18n.js';

export const tabletopFlag_ui = defineFurnitureUi<typeof tabletopFlag_schema>({
	name: i18n.ts._miRoom._objects.tabletopFlag,
	options: {
		image: {
			label: i18n.ts._miRoom._objects._tabletopFlag.image,
		},
	},
});
