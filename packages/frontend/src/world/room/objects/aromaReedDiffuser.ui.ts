/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { aromaReedDiffuser_schema } from 'misskey-world/src/room/objects/aromaReedDiffuser.schema.js';
import { i18n } from '@/i18n.js';

export const aromaReedDiffuser_ui = defineFunitureUi<typeof aromaReedDiffuser_schema>({
	name: i18n.ts._miRoom._objects.aromaReedDiffuser,
	options: {
		bottleMat: {
			label: i18n.ts._miRoom._objects._aromaReedDiffuser.bottleMat,
		},
		oilMat: {
			label: i18n.ts._miRoom._objects._aromaReedDiffuser.oilMat,
		},
	},
});
