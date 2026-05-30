/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { monstera_schema } from 'misskey-world/src/room/objects/monstera.schema.js';
import { i18n } from '@/i18n.js';

export const monstera_ui = defineFunitureUi<typeof monstera_schema>({
	name: i18n.ts._miRoom._objects.monstera,
	options: {
		potMat: {
			label: i18n.ts._miRoom._objects._monstera.potMat,
		},
	},
});
