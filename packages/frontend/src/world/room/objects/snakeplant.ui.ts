/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { snakeplant_schema } from './snakeplant.schema.js';
import { i18n } from '@/i18n.js';

export const snakeplant_ui = defineObjectUi<typeof snakeplant_schema>({
	name: i18n.ts._miRoom._objects.snakeplant,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._snakeplant.potMat,
		},
	},
});
