/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { pachira_schema } from 'misskey-world/src/room/objects/pachira.schema.js';
import { i18n } from '@/i18n.js';

export const pachira_ui = defineFunitureUi<typeof pachira_schema>({
	name: i18n.ts._miRoom._objects.pachira,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._pachira.potMat,
		},
	},
});
