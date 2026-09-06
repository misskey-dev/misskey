/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { aromaReedDiffuser_schema } from 'misskey-world/src/room/furnitures/aromaReedDiffuser.schema.js';
import { i18n } from '@/i18n.js';

export const aromaReedDiffuser_ui = defineFurnitureUi<typeof aromaReedDiffuser_schema>({
	name: i18n.ts._miRoom._furnitures.aromaReedDiffuser,
	options: {
		bottleMat: {
			label: i18n.ts._miRoom._furnitures._aromaReedDiffuser.bottleMat,
		},
		oilMat: {
			label: i18n.ts._miRoom._furnitures._aromaReedDiffuser.oilMat,
		},
	},
});
