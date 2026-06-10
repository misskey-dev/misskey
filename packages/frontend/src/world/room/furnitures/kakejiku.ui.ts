/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { kakejiku_schema } from 'misskey-world/src/room/furnitures/kakejiku.schema.js';
import { i18n } from '@/i18n.js';

export const kakejiku_ui = defineFurnitureUi<typeof kakejiku_schema>({
	name: i18n.ts._miRoom._furnitures.kakejiku,
	options: {
		image: {
			label: i18n.ts._miRoom._furnitures._kakejiku.image,
		},
	},
});
