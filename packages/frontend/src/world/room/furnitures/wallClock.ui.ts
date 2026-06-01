/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { wallClock_schema } from 'misskey-world/src/room/furnitures/wallClock.schema.js';
import { i18n } from '@/i18n.js';

export const wallClock_ui = defineFurnitureUi<typeof wallClock_schema>({
	name: i18n.ts._miRoom._furnitures.wallClock,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._furnitures._wallClock.frameMat,
		},
	},
});
