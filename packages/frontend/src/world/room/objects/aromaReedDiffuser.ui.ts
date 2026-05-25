/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { aromaReedDiffuser_schema } from './aromaReedDiffuser.schema.js';
import { i18n } from '@/i18n.js';

export const aromaReedDiffuser_ui = defineObjectUi<typeof aromaReedDiffuser_schema>({
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
