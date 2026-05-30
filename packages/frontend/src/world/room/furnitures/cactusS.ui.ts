/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { cactusS_schema } from 'misskey-world/src/room/furnitures/cactusS.schema.js';
import { i18n } from '@/i18n.js';

export const cactusS_ui = defineFurnitureUi<typeof cactusS_schema>({
	name: i18n.ts._miRoom._objects.cactusS,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._cactusS.potMat,
		},
	},
});
