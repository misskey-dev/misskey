/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { monstera_schema } from 'misskey-world/src/room/furnitures/monstera.schema.js';
import { i18n } from '@/i18n.js';

export const monstera_ui = defineFurnitureUi<typeof monstera_schema>({
	name: i18n.ts._miRoom._furnitures.monstera,
	options: {
		potMat: {
			label: i18n.ts._miRoom._furnitures._monstera.potMat,
		},
	},
});
