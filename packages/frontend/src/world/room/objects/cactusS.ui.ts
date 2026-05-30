/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { cactusS_schema } from 'misskey-world/src/room/objects/cactusS.schema.js';
import { i18n } from '@/i18n.js';

export const cactusS_ui = defineFunitureUi<typeof cactusS_schema>({
	name: i18n.ts._miRoom._objects.cactusS,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._cactusS.potMat,
		},
	},
});
