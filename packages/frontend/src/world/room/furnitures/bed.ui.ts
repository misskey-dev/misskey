/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { bed_schema } from 'misskey-world/src/room/furnitures/bed.schema.js';
import { i18n } from '@/i18n.js';

export const bed_ui = defineFurnitureUi<typeof bed_schema>({
	name: i18n.ts._miRoom._objects.bed,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._bed.frameMat,
		},
	},
});
