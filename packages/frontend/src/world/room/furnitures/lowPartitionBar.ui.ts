/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { lowPartitionBar_schema } from 'misskey-world/src/room/furnitures/lowPartitionBar.schema.js';
import { i18n } from '@/i18n.js';

export const lowPartitionBar_ui = defineFurnitureUi<typeof lowPartitionBar_schema>({
	name: i18n.ts._miRoom._furnitures.lowPartitionBar,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._furnitures._lowPartitionBar.bodyMat,
		},
		width: {
			label: i18n.ts._miRoom._furnitures._lowPartitionBar.width,
		},
	},
});
